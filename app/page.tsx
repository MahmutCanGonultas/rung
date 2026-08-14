import { neon } from "@neondatabase/serverless";

export default async function HomePage() {
  // ← 1. async eklendi
  const url = process.env.DATABASE_URL;
  if (!url)
    throw new Error(
      "DATABASE_URL tanımlı değil — .env.local dosyasını kontrol et",
    );

  const sql = neon(url);
  const rows = await sql`SELECT now()`; // ← 2. sorgu

  return (
    <main>
      <h1>Rung</h1>
      <p>İngilizce teşhis ve ilerleme sistemi.</p>
      <p>Veritabanı saati: {String(rows[0].now)}</p> // ← 3. ekrana bas
    </main>
  );
}
