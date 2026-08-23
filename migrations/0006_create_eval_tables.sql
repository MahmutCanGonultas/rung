-- Altın küme ve ölçüm koşumları.
--
-- Plan §09: "gold_items ve eval_runs şemada İLK GÜNDEN var. Ölçüm sonradan
-- eklenen bir özellik değil, ürünün parçası."
--
-- Bu iki tablo projenin kalbi. Onlar olmadan "prompt'u iyileştirdim"
-- cümlesi ölçülemez bir iddia olarak kalır.

-- ── altın küme ──────────────────────────────────────────────────────────
-- Hataları ÖNCEDEN bilinen paragraflar. Her örnek bir seviyeye ait, çünkü
-- doğruluk seviyeye göre değişiyor ve tek ortalama sayı bunu gizler (§06).
CREATE TABLE gold_items (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  level       TEXT        NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  body        TEXT        NOT NULL,
  notes       TEXT,

  -- Nereden geldi: elle yazıldı mı, kullanıcı itirazından mı doğdu.
  -- Plan §07 beşinci savunma: itirazlar kümeyi kendiliğinden büyütür.
  source      TEXT        NOT NULL DEFAULT 'authored'
                          CHECK (source IN ('authored', 'feedback')),
  source_finding_id BIGINT REFERENCES findings (id) ON DELETE SET NULL,

  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Aynı metin iki kez kümeye girmesin: ölçüm ağırlığı bozulur.
  UNIQUE (body)
);

CREATE INDEX gold_items_level_idx ON gold_items (level) WHERE active;

-- ── beklenen hatalar ────────────────────────────────────────────────────
-- Bir altın örnekte hangi hataların bulunmasını bekliyoruz.
-- `optional`: bulunması iyi ama bulunmaması yakalama oranını düşürmesin —
-- tartışmalı olan, stil sınırındaki şeyler için.
CREATE TABLE gold_expectations (
  id           BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  gold_item_id BIGINT NOT NULL REFERENCES gold_items (id) ON DELETE CASCADE,
  subcategory  TEXT   NOT NULL,
  original     TEXT   NOT NULL,
  optional     BOOLEAN NOT NULL DEFAULT false,

  UNIQUE (gold_item_id, original, subcategory)
);

CREATE INDEX gold_expectations_item_idx ON gold_expectations (gold_item_id);

-- ── ölçüm koşumları ─────────────────────────────────────────────────────
-- Bir koşum = bir model + bir prompt sürümü + bir çaba, tüm küme üzerinde.
-- İki koşumu karşılaştırmak için üçünün de kayıtlı olması şart; biri
-- eksikse "v2 daha iyi" cümlesi neyin daha iyi olduğunu söylemiyor.
CREATE TABLE eval_runs (
  id             BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  model_id       TEXT        NOT NULL,
  prompt_version TEXT        NOT NULL,
  effort         TEXT        NOT NULL,
  layers         TEXT        NOT NULL CHECK (layers IN ('K1', 'K1+K2')),

  items          INT         NOT NULL CHECK (items >= 0),
  expected       INT         NOT NULL CHECK (expected >= 0),
  found          INT         NOT NULL CHECK (found >= 0),
  true_positive  INT         NOT NULL CHECK (true_positive >= 0),
  false_positive INT         NOT NULL CHECK (false_positive >= 0),
  false_negative INT         NOT NULL CHECK (false_negative >= 0),

  cost_usd       NUMERIC(12, 6) CHECK (cost_usd >= 0),
  duration_ms    INT         CHECK (duration_ms >= 0),
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX eval_runs_created_idx ON eval_runs (created_at DESC);

-- ── seviye kırılımı ─────────────────────────────────────────────────────
-- Plan §06: "Tek bir ortalama sayı bu gerçeği gizler." Her koşum seviye
-- kırılımıyla birlikte saklanıyor; pano zayıf seviyeyi gizlemiyor.
CREATE TABLE eval_run_levels (
  id             BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  eval_run_id    BIGINT NOT NULL REFERENCES eval_runs (id) ON DELETE CASCADE,
  level          TEXT   NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  items          INT    NOT NULL CHECK (items >= 0),
  expected       INT    NOT NULL CHECK (expected >= 0),
  true_positive  INT    NOT NULL CHECK (true_positive >= 0),
  false_positive INT    NOT NULL CHECK (false_positive >= 0),
  false_negative INT    NOT NULL CHECK (false_negative >= 0),

  UNIQUE (eval_run_id, level)
);
