-- Analiz koşumları, bulgular ve kullanıcı itirazları.
--
-- Plan §09: "gold_items ve eval_runs şemada İLK GÜNDEN var. Ölçüm sonradan
-- eklenen bir özellik değil, ürünün parçası." Aynı ilke burada da geçerli:
-- bir bulgunun hangi model ve hangi prompt sürümü tarafından üretildiği,
-- bulgunun kendisiyle birlikte saklanıyor. Sürüm tutulmazsa "altı ayda
-- ilerledim" grafiği yalan söyler — metin değil, modeli değişmiştir.

-- ── analiz koşumları ────────────────────────────────────────────────────
CREATE TABLE analyses (
  id             BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entry_id       BIGINT      NOT NULL REFERENCES entries (id) ON DELETE CASCADE,

  -- Hangi katman: K0 deterministik, K1 model çıkarımı, K2 ikinci geçiş.
  layer          TEXT        NOT NULL CHECK (layer IN ('K0', 'K1', 'K2')),

  -- K0'da ikisi de NULL — model kullanılmıyor. K1/K2'de zorunlu.
  model_id       TEXT,
  prompt_version TEXT,

  status         TEXT        NOT NULL CHECK (status IN ('ok', 'failed')),
  error          TEXT,

  -- Maliyet takibi. Plan §08: doğruluk panosunda "kayıt başı maliyet" var.
  input_tokens   INT         CHECK (input_tokens  >= 0),
  output_tokens  INT         CHECK (output_tokens >= 0),
  cost_usd       NUMERIC(12, 6) CHECK (cost_usd >= 0),
  duration_ms    INT         CHECK (duration_ms >= 0),

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Model kullanan katman modelini söylemek zorunda.
  CONSTRAINT analyses_model_required
    CHECK (layer = 'K0' OR (model_id IS NOT NULL AND prompt_version IS NOT NULL))
);

CREATE INDEX analyses_entry_idx ON analyses (entry_id, created_at DESC);

-- ── bulgular ────────────────────────────────────────────────────────────
CREATE TABLE findings (
  id           BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  analysis_id  BIGINT NOT NULL REFERENCES analyses (id) ON DELETE CASCADE,
  entry_id     BIGINT NOT NULL REFERENCES entries (id)  ON DELETE CASCADE,

  -- Sabit taksonomi (app/lib/taxonomy.ts). Serbest metin değil.
  subcategory  TEXT   NOT NULL,

  -- Metindeki konum. Bulgu her zaman bir yere çapalanır.
  start_offset INT    NOT NULL CHECK (start_offset >= 0),
  end_offset   INT    NOT NULL,

  original     TEXT   NOT NULL,
  suggestion   TEXT,
  explanation  TEXT   NOT NULL,
  confidence   REAL   NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  layer        TEXT   NOT NULL CHECK (layer IN ('K0', 'K1')),

  -- K2 ikinci geçişin kararı. NULL = henüz sorulmadı.
  -- 'uncertain' olan bulgu ekranda ŞÜPHELİ gösterilir ve istatistiğe girmez.
  verdict      TEXT   CHECK (verdict IN ('confirmed', 'rejected', 'uncertain')),

  CONSTRAINT findings_span_valid CHECK (end_offset > start_offset)
);

CREATE INDEX findings_entry_idx    ON findings (entry_id);
CREATE INDEX findings_analysis_idx ON findings (analysis_id);

-- ── kullanıcı itirazları ────────────────────────────────────────────────
-- Plan §07 beşinci savunma: "Kullanıcı katılmadığı düzeltmeyi işaretler.
-- O itirazlar altın kümeyi kendiliğinden büyütür." Bu tablo eval'in ham verisi.
CREATE TABLE finding_feedback (
  id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  finding_id BIGINT      NOT NULL REFERENCES findings (id) ON DELETE CASCADE,
  user_id    BIGINT      NOT NULL REFERENCES users (id)    ON DELETE CASCADE,
  agreed     BOOLEAN     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Aynı kişi aynı bulguya bir kez cevap verir; fikrini değiştirirse günceller.
  UNIQUE (finding_id, user_id)
);

CREATE INDEX finding_feedback_user_idx ON finding_feedback (user_id);
