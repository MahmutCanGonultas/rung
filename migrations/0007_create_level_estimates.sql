-- Seviye tahmini, zaman serisi olarak.
--
-- Plan §06: "Tahmin sürekli güncellenir; 'ilerleme' dediğin şey bu bandın
-- kaymasıdır."
--
-- Her kayıttan sonra yeni bir satır yazılıyor, eskisi güncellenmiyor: ilerleme
-- grafiği ancak geçmiş tahminler dururken çizilebiliyor. Üzerine yazmak,
-- ölçmek istediğimiz şeyi silmek olurdu.

CREATE TABLE level_estimates (
  id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,

  -- Hangi kayıttan sonra hesaplandı. Silinirse tahmin kalıyor: geçmiş
  -- ölçüm, kaynağı gitti diye yalan olmuyor.
  entry_id   BIGINT      REFERENCES entries (id) ON DELETE SET NULL,

  level      TEXT        NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1')),
  -- 0–4 arası ham skor. Bant kaymasını değil, kayma EĞİLİMİNİ bu gösteriyor:
  -- B1'den B1'e ama 1.6'dan 1.9'a çıkmak da ilerleme.
  score      NUMERIC(4, 3) NOT NULL CHECK (score >= 0 AND score <= 4),

  -- Dayandığı dört sinyal, olduğu gibi. Eşikler değişirse eski tahminlerin
  -- neye dayandığı yine okunabilir olsun diye.
  signals    JSONB       NOT NULL,
  reliable   BOOLEAN     NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX level_estimates_user_time_idx
  ON level_estimates (user_id, created_at DESC);
