-- Aşama 02'nin şeması: bağlamlar, görevler, kayıtlar.
--
-- Üç tablonun zinciri: bir kayıt (entry) bir bağlama (context) ve çoğu zaman
-- bir göreve (task) bağlı. Bağlantı yabancı anahtarla (foreign key) kuruluyor;
-- veritabanı böylece olmayan bir bağlama işaret eden kayıt yazılmasına izin
-- vermiyor. Bu kontrol kodda değil burada duruyor, çünkü kodda unutulabilir.

-- ── bağlamlar ───────────────────────────────────────────────────────────
-- Plan §09: "kod değil veri — yeni bağlam eklemek satır eklemektir."
CREATE TABLE contexts (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug        TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL,
  sort_order  INT         NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── görevler ────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  context_id BIGINT      NOT NULL REFERENCES contexts (id) ON DELETE CASCADE,
  level      TEXT        NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  prompt     TEXT        NOT NULL,
  hint       TEXT        NOT NULL,
  min_words  INT         NOT NULL CHECK (min_words > 0),
  max_words  INT         NOT NULL CHECK (max_words >= min_words),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tohum betiği aynı görevi iki kez eklemesin diye doğal anahtar.
  UNIQUE (context_id, level, prompt)
);

CREATE INDEX tasks_context_level_idx ON tasks (context_id, level);

-- ── kayıtlar ────────────────────────────────────────────────────────────
-- `task_id` boş olabilir: serbest yazımda görev yok.
-- `ON DELETE RESTRICT`: bir görev silinmek istenirse ve ona bağlı kayıt varsa
-- veritabanı engelliyor. Kaydın hangi göreve cevap olduğu bilgisi, kaydın
-- kendisi kadar değerli — sessizce NULL'a düşmesi geçmişi bozar.
CREATE TABLE entries (
  id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  context_id BIGINT      NOT NULL REFERENCES contexts (id) ON DELETE RESTRICT,
  task_id    BIGINT      REFERENCES tasks (id) ON DELETE RESTRICT,
  body       TEXT        NOT NULL CHECK (length(body) BETWEEN 1 AND 20000),
  word_count INT         NOT NULL CHECK (word_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Geçmiş ekranı: "bu kullanıcının kayıtları, en yeniden eskiye".
CREATE INDEX entries_user_created_idx ON entries (user_id, created_at DESC);

-- Metin araması. ILIKE '%kelime%' yerine tam metin araması kullanılıyor:
-- "meetings" yazınca "meeting" geçen kayıt da bulunuyor, ve GIN indeksi
-- sayesinde kayıt sayısı büyüdükçe yavaşlamıyor. Metinler İngilizce.
CREATE INDEX entries_body_search_idx
  ON entries USING GIN (to_tsvector('english', body));

-- ── kayıtlar değiştirilemez ─────────────────────────────────────────────
-- Plan §03: "Metin, bulgular, model kimliği, prompt sürümü birlikte saklanır.
-- Kayıtlar değiştirilemez."
--
-- Sebebi ölçüm: altı ay sonra "ilerledim" diyebilmek için karşılaştırılan iki
-- metnin de yazıldığı gündeki hâliyle durması gerekiyor. Sonradan düzeltilen
-- bir metin ilerleme grafiğini sessizce yalancı yapar.
--
-- Kural kodda değil veritabanında: kod değişir, unutulur, ikinci bir yazma
-- yolu açılır. Trigger her yoldan geçeni yakalar.
--
-- DELETE serbest bırakıldı — kullanıcı hesabını silebilmeli (users'tan
-- ON DELETE CASCADE geliyor). Yasak olan sonradan DÜZELTMEK.
CREATE FUNCTION entries_reject_update() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'entries rows are immutable (entry id %)', OLD.id
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entries_no_update
  BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION entries_reject_update();
