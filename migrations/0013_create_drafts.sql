-- TASLAKLAR — bitmemiş paragraf bir yerde durabilsin.
--
-- NEDEN AYRI TABLO, `entries`e bir bayrak DEĞİL: `entries` satırları
-- DEĞİŞTİRİLEMEZ ve bu kural kodda değil, veritabanında bir trigger olarak
-- duruyor (bkz. 0003). Sebebi de ölçümün kendisi — altı ay sonra "ilerledim"
-- diyebilmek için iki metnin de yazıldığı gündeki hâliyle durması gerekiyor.
--
-- Taslak ise tanımı gereği DEĞİŞİR: yazarken her birkaç saniyede bir üstüne
-- yazılıyor. İkisi aynı tabloda olamaz. Bayrak eklemek, o trigger'ı kaldırmak
-- ya da etrafından dolaşmak demekti; ikisi de ürünün en sert kuralını
-- gevşetirdi.
--
-- TASLAK GÜNLÜK HAKKI YAKMIYOR. Hak, model çağrısı yapan ÖLÇÜME ait
-- (`dailyQuota` `entries` sayıyor). Taslak hiçbir dış servise gitmiyor, yani
-- bir bedeli yok. Yan etkisi de doğru olan: bugünlük hakkı dolan biri yazmaya
-- devam edebiliyor ve metni yarına kadar duruyor.

CREATE TABLE drafts (
  id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,

  -- Bağlam ve görev, `entries`in tersine ON DELETE CASCADE. Orada RESTRICT
  -- var çünkü kaydın hangi görevden geldiği kaydın bir parçası ve silinemez.
  -- Taslak bir kayıt değil, yarım kalmış bir iş: dayandığı görev listeden
  -- kalkarsa taslağın da anlamı kalmıyor.
  context_id BIGINT      NOT NULL REFERENCES contexts (id) ON DELETE CASCADE,
  task_id    BIGINT      REFERENCES tasks (id) ON DELETE CASCADE,

  -- `entries.body` ile aynı sınır: taslak gönderilebilir olmalı.
  body       TEXT        NOT NULL CHECK (length(body) BETWEEN 1 AND 20000),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- HER YAZMA DURUMUNUN KENDİ TASLAĞI.
  --
  -- Tek taslak da düşünüldü ve elendi: kişi A görevinde yarım bırakıp B
  -- görevine geçtiğinde tek taslak ya A'yı SESSİZCE eziyor ya da B'de
  -- kaydetmeyi kapatmak gerekiyordu. Birincisi yazıyı kaybettiriyor,
  -- ikincisi açıklaması zor bir kural.
  --
  -- `NULLS NOT DISTINCT` şart: kendi konusunda yazarken `task_id` NULL ve
  -- Postgres varsayılanında NULL'lar birbirinden farklı sayılıyor — yani
  -- kısıt hiç tutmuyor ve kişi her kaydedişte yeni bir "kendi konum" taslağı
  -- biriktiriyordu.
  CONSTRAINT drafts_one_per_situation UNIQUE NULLS NOT DISTINCT (user_id, task_id),

  CONSTRAINT drafts_updated_forward CHECK (updated_at >= created_at)
);

-- "Bu kullanıcının taslakları, en son dokunulandan geriye" — hem taslak
-- listesi hem de `/write`in "kaldığın yerden devam et" dalı bunu okuyor.
CREATE INDEX drafts_user_updated_idx ON drafts (user_id, updated_at DESC);

COMMENT ON TABLE drafts IS
  'Bitmemiş metinler. Her yazma durumu (görev ya da kendi konusu) için bir tane; gönderilince siliniyor.';
COMMENT ON COLUMN drafts.updated_at IS
  'Son otomatik kaydın anı. Ekranda "taslak kaydedildi · 14:32" olarak görünüyor.';
