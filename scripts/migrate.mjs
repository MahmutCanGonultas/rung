/*
 * Migration çalıştırıcısı.
 *
 * Klasördeki dosyalar ile veritabanındaki `schema_migrations` tablosunun
 * farkını, ada göre sırayla çalıştırır. Her dosya kendi transaction'ında
 * çalışır: dosyanın içindeki komutlardan biri patlarsa hiçbiri kalmaz.
 *
 * Çalıştırma:  npm run migrate
 *
 * Not: `schema_migrations` defteri projeye sonradan geldi. Defterden önce elle
 * uygulanmış bir migration varsa (bu projede 0001), o dosya adı deftere bir
 * kez elle işlenir — yoksa çalıştırıcı onu tekrar uygulamaya kalkar ve "zaten
 * var" hatasıyla durur. Boş bir veritabanında böyle bir sorun yok, dosyalar
 * baştan sırayla çalışır.
 *
 * Sürücü olarak `neon()` değil `Client` kullanılıyor. Sebep: HTTP sürücüsü
 * tek seferde tek komut kabul ediyor ("cannot insert multiple commands into
 * a prepared statement") ve transaction açamıyor. `Client` kalıcı bir
 * bağlantı kuruyor, o yüzden sonunda kapatmak gerekiyor.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "@neondatabase/serverless";

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations");

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL tanımlı değil. `npm run migrate` bunu .env.local'den okur; " +
        "dosya yerinde mi ve içinde DATABASE_URL var mı diye bak."
    );
  }
  return url;
}

/*
 * Aynı anda iki `npm run migrate` çalışırsa ikisi de "bekleyen" listesini aynı
 * görür ve aynı dosyayı uygulamaya kalkar. Postgres'in danışma kilidi (advisory
 * lock) bunu tek satırla çözüyor: kilidi ilk alan çalışır, ikincisi bekler.
 * Sayı rastgele ama sabit — aynı sayıyı kullanan herkes aynı kuyruğa girer.
 */
const LOCK_ID = 8123407;

async function withLock(client, work) {
  await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
  try {
    return await work();
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]);
  }
}

async function ensureLedger(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function appliedFilenames(client) {
  const result = await client.query("SELECT filename FROM schema_migrations");
  return new Set(result.rows.map((row) => row.filename));
}

async function pendingFiles(applied) {
  const names = await readdir(MIGRATIONS_DIR);
  return names
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .filter((name) => !applied.has(name));
}

async function applyOne(client, filename) {
  const sql = await readFile(path.join(MIGRATIONS_DIR, filename), "utf8");

  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [
      filename,
    ]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(`${filename} çalışmadı — hiçbir değişiklik uygulanmadı.`, {
      cause: error,
    });
  }
}

async function main() {
  const client = new Client(requireDatabaseUrl());
  await client.connect();

  try {
    await withLock(client, async () => {
      await ensureLedger(client);

      const applied = await appliedFilenames(client);
      const pending = await pendingFiles(applied);

      if (pending.length === 0) {
        console.log(`güncel · ${applied.size} migration zaten uygulanmış`);
        return;
      }

      for (const filename of pending) {
        await applyOne(client, filename);
        console.log(`uygulandı  ${filename}`);
      }

      console.log(`bitti · ${pending.length} yeni migration`);
    });
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  if (error.cause) {
    console.error(`  sebep: ${error.cause.message}`);
  }
  process.exitCode = 1;
});
