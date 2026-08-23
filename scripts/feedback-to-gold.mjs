/*
 * İtirazları altın kümeye akıtır.
 *
 * Çalıştırma:  npm run gold:from-feedback
 *              npm run gold:from-feedback -- --dry
 *
 * Plan §07 beşinci savunma: "Kullanıcı katılmadığı düzeltmeyi işaretler.
 * O itirazlar altın kümeyi kendiliğinden büyütür."
 *
 * NASIL ÇALIŞIYOR
 * Kullanıcı bir bulguya "katılmıyorum" dediyse, sistem o metinde olmayan bir
 * hata görmüş demektir — yani bir YANLIŞ ALARM örneği. Kaydın metni altın
 * kümeye ekleniyor ve o parça için hiçbir beklenti yazılmıyor: bir dahaki
 * ölçümde model orada yine hata bulursa yanlış alarm olarak sayılacak.
 *
 * NEDEN OTOMATİK DEĞİL
 * Bu betik elle çalıştırılıyor. Kullanıcı yanılmış da olabilir — gerçekten
 * hata olan bir şeye itiraz etmiş olabilir. Ölçümün temeli olan kümeye
 * kontrolsüz veri akıtmak, ölçüm aracının kendisini bozar. Betik ne
 * ekleyeceğini yazıyor, `--dry` ile önce bakılıyor.
 */

import { Client } from "@neondatabase/serverless";

const DRY = process.argv.includes("--dry");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil.");

  const client = new Client(url);
  await client.connect();

  try {
    /*
     * Henüz kümeye girmemiş itirazlar. `gold_items.source_finding_id` aynı
     * bulgunun ikinci kez eklenmesini engelliyor.
     */
    const rows = await client.query(`
      SELECT f.id::text AS finding_id,
             f.subcategory,
             f.original,
             f.explanation,
             e.body,
             t.level
      FROM finding_feedback fb
      JOIN findings f ON f.id = fb.finding_id
      JOIN entries  e ON e.id = f.entry_id
      LEFT JOIN tasks t ON t.id = e.task_id
      WHERE fb.agreed = false
        AND NOT EXISTS (
          SELECT 1 FROM gold_items g WHERE g.source_finding_id = f.id
        )
      ORDER BY fb.created_at
    `);

    if (rows.rows.length === 0) {
      console.log("kümeye akıtılacak yeni itiraz yok.");
      return;
    }

    console.log(`${rows.rows.length} itiraz bulundu:\n`);

    let added = 0;
    let skipped = 0;

    for (const row of rows.rows) {
      const level = row.level ?? "B1";
      const preview = row.body.replace(/\s+/g, " ").slice(0, 70);
      console.log(`  [${level}] "${row.original}" · ${row.subcategory}`);
      console.log(`         metin: ${preview}…`);

      if (DRY) continue;

      const result = await client.query(
        `INSERT INTO gold_items (level, body, notes, source, source_finding_id)
         VALUES ($1, $2, $3, 'feedback', $4)
         ON CONFLICT (body) DO NOTHING
         RETURNING id`,
        [
          level,
          row.body,
          `Kullanıcı itirazından geldi. Sistem "${row.original}" için ` +
            `${row.subcategory} dedi, kullanıcı katılmadı. Bu parça için ` +
            `beklenti YAZILMADI — tekrar bulunursa yanlış alarm sayılacak.`,
          row.finding_id,
        ]
      );

      if (result.rowCount > 0) added++;
      else skipped++;
    }

    if (DRY) {
      console.log(`\n--dry · hiçbir şey yazılmadı. Yazmak için bayrağı kaldır.`);
    } else {
      console.log(`\n${added} örnek eklendi · ${skipped} zaten kümedeydi`);
      console.log("Beklentiler elle gözden geçirilmeli: kullanıcı yanılmış olabilir.");
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("itirazlar akıtılamadı:", error.message);
  process.exitCode = 1;
});
