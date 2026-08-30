-- ELLE YAZILABİLİR KOD — mail spam'e düştüğünde ürünün çalışmaya devam etmesi
-- için.
--
-- NEDEN: gönderim alan adı saatler yaşında ve Microsoft bilinmeyen göndereni
-- varsayılan olarak "gereksiz" klasörüne koyuyor. ÖLÇÜLDÜ: ilk gerçek
-- doğrulama maili Outlook'ta junk'a düştü. Bunun kısa vadede çaresi yok —
-- itibar zamanla oluşuyor, satın alınamıyor.
--
-- Bağlantı tek yol olduğu sürece, junk'a düşen bir mail ÖLÜ UÇ demek. Yanına
-- altı haneli bir kod koyunca aynı mail otuz saniyelik bir sapmaya dönüyor:
-- kişi zaten açık duran sekmeye kodu yazıyor ve giriyor.
--
-- Kod bağlantının YERİNE değil YANINA. Bağlantı hâlâ tek tıkla çalışıyor ve
-- hâlâ tercih edilen yol.

ALTER TABLE pending_signups
  -- Altı hane, açık metin. HASH'LENMİYOR ve bu bilinçli: 10^6 olasılıkta bir
  -- özet önemsiz bir maliyetle geri çevrilir, yani hash burada güvenlik değil
  -- gösteri olurdu. Gerçek koruma denemenin SINIRLI olması (aşağıdaki sayaç)
  -- ve kaydın yirmi dört saatte ölmesi.
  ADD COLUMN code TEXT NOT NULL DEFAULT '',

  -- KAÇ KEZ YANLIŞ YAZILDI.
  --
  -- Altı hane tek başına zayıf: sınırsız denemede bir milyon olasılık hiçbir
  -- şey. Sayaç beşe varınca bekleyen kayıt tamamen düşüyor — yani saldırganın
  -- bütün alanı taraması değil, beş atışı var. Yanlış kod yazan gerçek kişi
  -- de kaybetmiyor: yeniden kaydolup yeni bir kod alabiliyor.
  ADD COLUMN code_tries SMALLINT NOT NULL DEFAULT 0;

-- Kod adresle birlikte aranıyor: "bu adresin bekleyen kaydında bu kod var mı".
-- `pending_signups_email_idx` zaten var, ek indekse gerek yok.

COMMENT ON COLUMN pending_signups.code IS
  'Mailde bağlantının yanında duran altı haneli kod. Spam''e düşen mail de işe yarasın diye.';
COMMENT ON COLUMN pending_signups.code_tries IS
  'Yanlış deneme sayısı. Beşte kayıt düşüyor — altı hane sınırsız denemeye karşı zayıf.';
