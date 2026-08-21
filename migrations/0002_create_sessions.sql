-- Oturumlar. Çerezde jetonun kendisi, burada SHA-256 özeti duruyor:
-- veritabanı sızarsa jetonlar kullanılamaz. Jeton 32 rastgele bayt
-- olduğu için burada yavaş hash gerekmiyor (bcrypt sadece insan
-- seçimi şifreler için — orada tahmin edilebilirlik var, burada yok).

CREATE TABLE sessions (
  token_hash TEXT        PRIMARY KEY,
  user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- "bu kullanıcının bütün oturumlarını düşür" için
CREATE INDEX sessions_user_id_idx ON sessions (user_id);

-- süresi geçmişleri toplamak için
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);
