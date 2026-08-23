/*
 * Altın kümeyi veritabanına yazar.
 *
 * Çalıştırma:  npm run seed:gold
 *
 * Tekrar çalıştırılabilir: metin doğal anahtar (`gold_items.body` UNIQUE),
 * beklentiler her seferinde yeniden kuruluyor. Bir beklentiyi düzeltip
 * tekrar çalıştırmak yeterli.
 *
 * Konumlar burada hesaplanıyor, elle yazılmıyor: `original` metinde
 * aranıyor. Bulunamazsa ya da birden fazla kez geçiyorsa betik DURUYOR —
 * belirsiz konumlu bir beklenti, ölçümü sessizce yanlış yapar.
 */

import { Client } from "@neondatabase/serverless";

import { GOLD } from "./gold-data.mjs";

function locate(body, span, level, index) {
  const first = body.indexOf(span);
  if (first === -1) {
    throw new Error(`#${index} (${level}): "${span}" metinde geçmiyor.`);
  }
  if (body.indexOf(span, first + 1) !== -1) {
    throw new Error(
      `#${index} (${level}): "${span}" metinde birden fazla kez geçiyor — konum belirsiz.`
    );
  }
  return { start: first, end: first + span.length };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil.");

  // Yazmadan önce hepsini doğrula: yarım yazılmış küme, yanlış ölçüm demek.
  for (const [index, item] of GOLD.entries()) {
    for (const [, span] of item.expect) locate(item.body, span, item.level, index);
  }

  const client = new Client(url);
  await client.connect();

  let inserted = 0;
  let updated = 0;
  let expectations = 0;

  try {
    await client.query("BEGIN");

    for (const [index, item] of GOLD.entries()) {
      const result = await client.query(
        `INSERT INTO gold_items (level, body, notes, source)
         VALUES ($1, $2, $3, 'authored')
         ON CONFLICT (body) DO UPDATE
           SET level = EXCLUDED.level, notes = EXCLUDED.notes
         RETURNING id, (xmax = 0) AS was_insert`,
        [item.level, item.body, item.notes]
      );

      const goldId = result.rows[0].id;
      result.rows[0].was_insert ? inserted++ : updated++;

      // Beklentiler her koşumda yeniden kuruluyor — düzeltmeler yansısın.
      await client.query("DELETE FROM gold_expectations WHERE gold_item_id = $1", [goldId]);

      for (const [subcategory, span, optional] of item.expect) {
        locate(item.body, span, item.level, index);
        await client.query(
          `INSERT INTO gold_expectations (gold_item_id, subcategory, original, optional)
           VALUES ($1, $2, $3, $4)`,
          [goldId, subcategory, span, Boolean(optional)]
        );
        expectations++;
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }

  const clean = GOLD.filter((i) => i.expect.length === 0).length;
  console.log(`altın küme · ${inserted} eklendi, ${updated} güncellendi`);
  console.log(`beklenti   · ${expectations}`);
  console.log(
    `temiz metin · ${clean} / ${GOLD.length} — yanlış alarm bunlarla ölçülüyor`
  );
}

main().catch((error) => {
  console.error("altın küme yazılamadı:", error.message);
  process.exitCode = 1;
});
