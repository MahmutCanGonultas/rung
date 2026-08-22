-- Başarısız koşumda model kimliği yok.
--
-- 0004'teki kısıt "K0 dışındaki her koşum model_id ve prompt_version yazmak
-- zorunda" diyordu. Ama model çağrısı hiç kurulamadan patlarsa (anahtar yok,
-- ağ yok) elimizde model kimliği olmuyor — ve o başarısızlığın kaydedilmesi
-- tam da ölçmek istediğimiz şey.
--
-- Yeni kural: kısıt sadece BAŞARILI koşumlar için geçerli.

ALTER TABLE analyses DROP CONSTRAINT analyses_model_required;

ALTER TABLE analyses ADD CONSTRAINT analyses_model_required
  CHECK (
    layer = 'K0'
    OR status = 'failed'
    OR (model_id IS NOT NULL AND prompt_version IS NOT NULL)
  );
