/*
 * Tohum veriyi veritabanına yazar.
 *
 * Çalıştırma:  npm run seed
 *
 * Tekrar çalıştırılabilir (idempotent): var olan satırı günceller, olmayanı
 * ekler. Bir görevin metnini düzeltip tekrar çalıştırmak yeterli.
 *
 * Migration değil, betik. Sebep: migration'lar dondurulur ve bir daha
 * çalışmaz; içerik ise zamanla değişecek. Şema migration'da, içerik burada.
 */

import { Client } from "@neondatabase/serverless";

import { CONTEXTS, TASKS } from "./seed-data.mjs";

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil.");
  return url;
}

async function seedContexts(client) {
  let inserted = 0;
  let updated = 0;

  for (const c of CONTEXTS) {
    const result = await client.query(
      `INSERT INTO contexts (slug, name, description, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name,
             description = EXCLUDED.description,
             sort_order = EXCLUDED.sort_order
       RETURNING (xmax = 0) AS was_insert`,
      [c.slug, c.name, c.description, c.sortOrder]
    );
    result.rows[0].was_insert ? inserted++ : updated++;
  }

  return { inserted, updated };
}

async function seedTasks(client) {
  const rows = await client.query("SELECT id, slug FROM contexts");
  const idBySlug = new Map(rows.rows.map((r) => [r.slug, r.id]));

  let inserted = 0;
  let updated = 0;

  for (const task of TASKS) {
    const contextId = idBySlug.get(task.context);
    if (!contextId) {
      throw new Error(`Görev tanımsız bir bağlama işaret ediyor: ${task.context}`);
    }

    const result = await client.query(
      `INSERT INTO tasks (context_id, level, prompt, hint, min_words, max_words)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (context_id, level, prompt) DO UPDATE
         SET hint = EXCLUDED.hint,
             min_words = EXCLUDED.min_words,
             max_words = EXCLUDED.max_words
       RETURNING (xmax = 0) AS was_insert`,
      [contextId, task.level, task.prompt, task.hint, task.minWords, task.maxWords]
    );
    result.rows[0].was_insert ? inserted++ : updated++;
  }

  return { inserted, updated };
}

async function main() {
  const client = new Client(requireDatabaseUrl());
  await client.connect();

  try {
    await client.query("BEGIN");
    const c = await seedContexts(client);
    const t = await seedTasks(client);
    await client.query("COMMIT");

    console.log(`bağlam · ${c.inserted} eklendi, ${c.updated} güncellendi`);
    console.log(`görev  · ${t.inserted} eklendi, ${t.updated} güncellendi`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("tohum verisi yazılamadı:", error.message);
  process.exitCode = 1;
});
