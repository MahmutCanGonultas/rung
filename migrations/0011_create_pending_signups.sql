-- BEKLEYEN KAYITLAR — hesap, bağlantıya tıklanana kadar açılmıyor.
--
-- NEDEN AYRI TABLO: `auth_tokens` bir kullanıcıya bağlı (`user_id` yabancı
-- anahtar). Burada henüz kullanıcı YOK — kayıt formunu dolduran kişinin
-- adresi ve şifresi, hesabı açılmadan önce bir yerde durmak zorunda.
--
-- NEDEN BÖYLE: "hesap açılsın, sonra doğrulansın" modelinde
-- `asdasdas@outlook.com` yazan biri veritabanında gerçek bir hesap olarak
-- duruyordu — doğrulanmamış, kurtarılamaz, ama var. Ürün sahibinin isteği
-- açıktı: "gerçek olduğuna emin olduğumuz e-postalar kaydolsun."
-- Bağlantıya tıklanması, o kutunun hem VAR OLDUĞUNUN hem de kişinin ona
-- ERİŞTİĞİNİN tek kanıtı. Kanıt gelmeden hesap yok.

CREATE TABLE pending_signups (
  -- Bağlantıda jetonun kendisi, burada SHA-256 özeti. `sessions` ve
  -- `auth_tokens` ile aynı karar: bir yedek sızarsa özetlerden hesap açılamaz.
  token_hash    TEXT        PRIMARY KEY,

  email         TEXT        NOT NULL,

  -- ŞİFRE BURADA DA BCRYPT'Lİ. Bekleyen kayıt geçici diye açık saklamak,
  -- sızıntıda insanların BAŞKA sitelerdeki şifrelerini vermek olurdu —
  -- insanlar şifre tekrar kullanıyor. `users.password_hash` ile aynı korumada.
  password_hash TEXT        NOT NULL,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,

  CONSTRAINT pending_signups_lives_forward CHECK (expires_at > created_at)
);

-- "Bu adresin bekleyen kaydını düşür" için: aynı adresle ikinci kez kayıt
-- denenirse eskisi ölüyor, yalnız sonuncusu yaşıyor. Yoksa kişinin kutusunda
-- birden fazla çalışan bağlantı birikiyor.
CREATE INDEX pending_signups_email_idx ON pending_signups (email);

-- Süresi geçmişleri toplamak için.
CREATE INDEX pending_signups_expires_at_idx ON pending_signups (expires_at);

COMMENT ON TABLE pending_signups IS
  'Doğrulanmayı bekleyen kayıtlar. Bağlantıya tıklanınca users satırına dönüşüyor.';
