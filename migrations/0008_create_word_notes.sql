-- Kelime defteri: "bunu bilmiyordum, sonra bakarım".
--
-- Not KAYNAĞINA ÇAPALI yazılıyor. Kaynaksız not ölçülemez ve hatırlanmaz:
-- kelimeyi NEREDE gördüğün, kelimenin kendisi kadar bilgi taşıyor. Çapa kuralı
-- kodda değil burada duruyor — kodda unutulur (0003'ün gerekçesiyle aynı).

CREATE TABLE word_notes (
  id                BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,

  -- Anahtar: küçük harfli yüzey biçimi. LEMMA DEĞİL. Bu projede lemmatizer
  -- (kök bulucu) yok; `k0/bands.ts` içindeki soyma tam bir kök bulucu değil ve
  -- kendi yorumunda bunu söylüyor. Olmayan bir şeyi varmış gibi adlandırmak,
  -- ölçüm aletinin yapamayacağı türden bir yalan olurdu.
  word              TEXT        NOT NULL
                    CHECK (word = lower(word) AND length(word) BETWEEN 1 AND 64),

  -- Kelimenin metinde göründüğü hâli ("Received", "informations").
  surface           TEXT        NOT NULL CHECK (length(surface) BETWEEN 1 AND 64),

  -- K0'ın ELLE DERLENMİŞ bant listesinden (plan §15 · `k0/word-bands.ts`).
  -- C1 burada "listede yok" demek, "ileri seviye" DEĞİL — ekran da öyle yazıyor.
  band              TEXT        NOT NULL CHECK (band IN ('A1','A2','B1','B2','C1')),

  -- Kelimenin nereden geldiği. Üçü de gerçekten bilinmeyen kelimenin ortaya
  -- çıktığı yerler:
  --   task       görev metnini okurken — "bu kelimeyi bilmiyorum"
  --   suggestion Rung'ın önerdiği kelime — "uzandım ama tutturamadım"
  --   entry      kendi yazdığın, bantta olmayan kelime
  source            TEXT        NOT NULL CHECK (source IN ('task','suggestion','entry')),

  source_entry_id   BIGINT      REFERENCES entries  (id) ON DELETE SET NULL,
  source_finding_id BIGINT      REFERENCES findings (id) ON DELETE SET NULL,
  -- ON DELETE RESTRICT: 0003'teki entries.task_id ile aynı gerekçe — görev
  -- silinirse ona bağlı geçmiş anlamsızlaşır.
  source_task_id    BIGINT      REFERENCES tasks    (id) ON DELETE RESTRICT,

  -- Kelimenin görüldüğü cümle. Bağlamsız kelime yarım bilgi: "fair" tek başına
  -- hiçbir şey, "that is fair to say" bir şey.
  context_snippet   TEXT        CHECK (context_snippet IS NULL
                                       OR length(context_snippet) <= 400),

  -- Kullanıcının KENDİ işareti: "artık biliyorum". Ölçüm değil, beyan —
  -- ekranda da öyle etiketleniyor.
  resolved_at       TIMESTAMPTZ,

  noted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Aynı kelime iki kez deftere girmiyor; ikinci kez işaretlemek kaynağı ve
  -- tarihi tazeliyor.
  UNIQUE (user_id, word),

  CONSTRAINT word_notes_source_anchored CHECK (
    (source = 'task'       AND source_task_id    IS NOT NULL) OR
    (source = 'suggestion' AND source_finding_id IS NOT NULL) OR
    (source = 'entry'      AND source_entry_id   IS NOT NULL)
  )
);

CREATE INDEX word_notes_user_time_idx ON word_notes (user_id, noted_at DESC);

-- Açık notları çekmek en sık sorgu.
CREATE INDEX word_notes_open_idx ON word_notes (user_id, noted_at DESC)
  WHERE resolved_at IS NULL;
