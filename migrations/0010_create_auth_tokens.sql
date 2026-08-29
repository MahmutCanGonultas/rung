-- E-posta doğrulama ve şifre sıfırlama.
--
-- NEDEN TEK TABLO: iki jetonun ömrü birebir aynı — üret, bir kez kullan,
-- süresi dolunca çöpe at. İki ayrı tablo aynı sorguları, aynı indeksleri ve
-- aynı temizlik işini iki kez yazmak olurdu. Aralarındaki tek gerçek fark
-- `purpose` sütununda.
--
-- JETON AÇIK DURMUYOR. `sessions` tablosundaki karar aynen geçerli: bağlantıda
-- jetonun kendisi, veritabanında SHA-256 özeti. Bir yedek sızarsa oradaki
-- özetlerle ne hesap doğrulanabilir ne şifre sıfırlanabilir. Jeton 32 rastgele
-- bayt olduğu için burada bcrypt gibi kasıtlı yavaş bir hash gerekmiyor:
-- yavaşlık TAHMİN EDİLEBİLİR girdilere karşı bir savunmadır, 256 bitlik
-- rastgelelikte tahmin edilecek bir şey yok.

-- Boolean değil TIMESTAMP. "Doğrulandı mı" sorusunun cevabı NULL kontrolüyle
-- zaten alınıyor; ama "ne zaman doğrulandı" sorusu er ya da geç soruluyor ve
-- boolean'a sonradan tarih eklenemiyor. Sütunun maliyeti aynı.
--
-- Mevcut hesaplar bilerek NULL kalıyor: toplu "doğrulanmış" sayılmıyorlar.
-- Proje sahibi de akıştan normal yoldan geçiyor, bu aynı zamanda akışın ilk
-- gerçek testi oluyor.
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN users.email_verified_at IS
  'Adresin sahipliğinin kanıtlandığı an. NULL ise kanıtlanmadı — hesap yine de çalışır.';

CREATE TABLE auth_tokens (
  token_hash  TEXT        PRIMARY KEY,
  user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  purpose     TEXT        NOT NULL
                          CHECK (purpose IN ('email_verify', 'password_reset')),

  -- Jetonun POSTALANDIĞI adres. `users.email`e bakmak yetmiyor: kullanıcı arada
  -- adresini değiştirirse eski adrese gitmiş bir bağlantı yeni adresi
  -- doğrulamamalı, yeni adresin şifresini de sıfırlamamalı. Jeton gönderildiği
  -- adrese çivileniyor ve kullanma anında ikisi karşılaştırılıyor.
  email       TEXT        NOT NULL,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,

  -- TEK KULLANIMLIK olmanın kaydı. Satır silinmiyor, damgalanıyor: "bu bağlantı
  -- zaten kullanılmış" ile "böyle bir bağlantı yok" ayrı cümleler ve ikisini
  -- ayırmak kimseye bir şey sızdırmıyor — jetonu elinde tutan kişi zaten jetonu
  -- biliyor. Ayrım olmadan, doğruladıktan sonra sayfayı yenileyen kullanıcıya
  -- "bu bağlantı geçersiz" yazıyorduk.
  consumed_at TIMESTAMPTZ,

  -- Kodda hesaplanan sürenin yanlışlıkla geçmişe düşmesine karşı kaba emniyet.
  -- Süresi doğuştan geçmiş bir jeton sessizce çalışmayan bir bağlantı üretirdi.
  CONSTRAINT auth_tokens_lives_forward CHECK (expires_at > created_at)
);

-- "Bu kullanıcının bekleyen jetonlarını düşür" için: yeni bağlantı istendiğinde
-- ve şifre sıfırlandığında bu yol kullanılıyor. Kısmi indeks — kullanılmış
-- satırlar bu sorunun konusu değil.
CREATE INDEX auth_tokens_pending_idx
  ON auth_tokens (user_id, purpose)
  WHERE consumed_at IS NULL;

-- Süresi geçmişleri toplamak için, `sessions` tablosundaki eşi gibi.
CREATE INDEX auth_tokens_expires_at_idx ON auth_tokens (expires_at);


-- ── HIZ SINIRI ───────────────────────────────────────────────────────────
--
-- Şifre sıfırlama isteği, kimlik doğrulamadan çalışan tek yazma yolu: hiç
-- oturum açmadan, sadece bir adres yazarak sunucuya mail attırabiliyorsun.
-- Sınırsız bırakılırsa iki şey oluyor — birinin kutusu bombalanıyor, ve
-- sağlayıcının günlük kotası (300) yanıyor.
--
-- KAYAN PENCERE, sabit pencere değil. Sabit pencerede sayaç ilk isteğin
-- saatinde sıfırlanıyor ve saldırgan pencerenin sonunda + başında iki katını
-- gönderebiliyor. Burada damgalar tek tek duruyor ve pencere her sorguda
-- "şimdiden geriye" hesaplanıyor.
CREATE TABLE auth_attempts (
  id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Neyin sayıldığı: 'reset:mahmut@ornek.com' ya da 'reset-ip:1.2.3.4'.
  -- Adres burada AÇIK duruyor ve bu bilerek: bu tablo bir hesap sırrı değil,
  -- bir sayaç. Özetlemek sorguyu zorlaştırır, koruduğu bir şey olmaz.
  bucket     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX auth_attempts_bucket_idx ON auth_attempts (bucket, created_at DESC);
