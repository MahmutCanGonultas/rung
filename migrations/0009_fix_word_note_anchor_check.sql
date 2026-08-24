-- 0008'deki çapa kısıtı, yabancı anahtarların kendisiyle çelişiyordu.
--
-- SORUN: `source_entry_id` ve `source_finding_id` sütunları ON DELETE SET NULL
-- ile tanımlıydı, ama `word_notes_source_anchored` kısıtı o sütunun NOT NULL
-- olmasını şart koşuyordu. Postgres, SET NULL'ı bir UPDATE olarak uyguluyor ve
-- CHECK kısıtları UPDATE'te yeniden değerlendiriliyor. Yani:
--
--   DELETE FROM findings WHERE id = 1;
--   ERROR:  new row for relation "word_notes" violates check constraint
--           "word_notes_source_anchored"
--   CONTEXT: SQL statement "UPDATE ONLY word_notes SET source_finding_id = NULL"
--
-- Bir kaydı, analizi ya da bulguyu silmek imkânsızdı. Gerçek bir kümede
-- yeniden üretildi. Bugüne kadar patlamamasının tek sebebi hiçbir kod yolunun
-- bunları silmiyor olması — yani hata gizliydi, yok değil.
--
-- KARAR: not, kaynağı silinse bile KALIYOR. Bilmediğin kelime, onu gördüğün
-- kayıt silindi diye değerini kaybetmiyor. `app/lib/vocab/notes.ts` zaten bunu
-- varsayıyordu (`entryId: string | null`, `LEFT JOIN` + `COALESCE`) — şema
-- kodun beklediği davranışı yasaklıyordu.
--
-- Yeni kısıt sahipliği değil, TUTARLILIĞI zorluyor: kaynağıyla eşleşmeyen çapa
-- yazılamıyor. `source_task_id` hâlâ NOT NULL isteniyor, çünkü o sütun ON
-- DELETE RESTRICT — null'a düşmesi mümkün değil.

ALTER TABLE word_notes DROP CONSTRAINT word_notes_source_anchored;

ALTER TABLE word_notes ADD CONSTRAINT word_notes_source_anchored CHECK (
  (source = 'task'
     AND source_task_id    IS NOT NULL
     AND source_entry_id   IS NULL
     AND source_finding_id IS NULL) OR
  (source = 'suggestion'
     AND source_task_id    IS NULL
     AND source_entry_id   IS NULL) OR
  (source = 'entry'
     AND source_task_id    IS NULL
     AND source_finding_id IS NULL)
);
