import "server-only";

import { db } from "../db";
import { FAMILIES, SUBCATEGORIES, type Family, type Subcategory } from "../taxonomy";
import type { Level } from "../content-types";

/*
 * İlerleme ekranının sorguları.
 *
 * KURAL: saymayı veritabanı yapıyor, kod değil.
 *
 * Alternatifi "bütün kayıtları çek, JavaScript'te say" olurdu. Altı ay sonra
 * bu 500 kayıt × ortalama 10 bulgu = 5.000 satırı ağdan geçirmek demek —
 * sayfa yavaşlar, bellek şişer, ve sonuç aynıdır. `count`, `sum`, `avg` ve
 * `date_trunc` veritabanının kendi işi.
 *
 * N+1 PROBLEMİ
 * Her kaydın bulgularını ayrı sorguyla çekmek de aynı hatanın başka hâli:
 * 1 sorgu liste için + N sorgu her satır için. 100 kayıt = 101 sorgu.
 * Buradaki sorguların hepsi JOIN ile tek geçişte topluyor.
 */

export type MonthPoint = {
  month: Date;
  entries: number;
  words: number;
  findings: number;
  /** 100 kelimede bulgu — metin uzunluğundan bağımsız tek karşılaştırılabilir sayı. */
  per100: number;
};

export async function monthlyDensity(userId: string): Promise<MonthPoint[]> {
  const rows = (await db()`
    SELECT date_trunc('month', e.created_at)      AS month,
           count(DISTINCT e.id)::int              AS entries,
           coalesce(sum(DISTINCT e.word_count), 0)::int AS words,
           count(f.id)::int                       AS findings
    FROM entries e
    LEFT JOIN findings f
      ON f.entry_id = e.id
     AND (f.verdict IS NULL OR f.verdict = 'confirmed')
    WHERE e.user_id = ${userId}
    GROUP BY 1
    ORDER BY 1
  `) as Array<{ month: Date; entries: number; words: number; findings: number }>;

  return rows.map((row) => ({
    month: row.month,
    entries: row.entries,
    words: row.words,
    findings: row.findings,
    per100: row.words === 0 ? 0 : (row.findings / row.words) * 100,
  }));
}

export type FamilyChange = {
  family: Family;
  label: string;
  firstMonth: number;
  lastMonth: number;
  /** Azalmıyorsa inatçı — bir sonraki tekrar seti buradan üretilecek. */
  stuck: boolean;
};

/*
 * Hata ailesi karşılaştırması: ilk ay ile son ay.
 *
 * Sayılar 100 kelimede oran olarak — ilk ay 200 kelime yazıp bu ay 2.000
 * yazan biri, ham sayıya bakılırsa "kötüleşmiş" görünürdü.
 */
export async function familyComparison(userId: string): Promise<FamilyChange[]> {
  const rows = (await db()`
    WITH months AS (
      SELECT min(date_trunc('month', created_at)) AS first_month,
             max(date_trunc('month', created_at)) AS last_month
      FROM entries WHERE user_id = ${userId}
    ),
    words AS (
      SELECT date_trunc('month', created_at) AS month,
             sum(word_count)::int            AS words
      FROM entries WHERE user_id = ${userId}
      GROUP BY 1
    )
    SELECT f.subcategory,
           date_trunc('month', e.created_at) AS month,
           count(*)::int                     AS n,
           w.words
    FROM findings f
    JOIN entries e ON e.id = f.entry_id
    JOIN words w ON w.month = date_trunc('month', e.created_at)
    CROSS JOIN months m
    WHERE e.user_id = ${userId}
      AND (f.verdict IS NULL OR f.verdict = 'confirmed')
      AND date_trunc('month', e.created_at) IN (m.first_month, m.last_month)
    GROUP BY f.subcategory, 2, w.words
  `) as Array<{ subcategory: Subcategory; month: Date; n: number; words: number }>;

  if (rows.length === 0) return [];

  const times = rows.map((r) => r.month.getTime());
  const first = Math.min(...times);
  const last = Math.max(...times);

  const totals = new Map<Family, { first: number; last: number }>();
  for (const key of Object.keys(FAMILIES) as Family[]) {
    totals.set(key, { first: 0, last: 0 });
  }

  for (const row of rows) {
    const family = SUBCATEGORIES[row.subcategory].family;
    const bucket = totals.get(family);
    if (!bucket || row.words === 0) continue;
    const per100 = (row.n / row.words) * 100;
    if (row.month.getTime() === first) bucket.first += per100;
    if (row.month.getTime() === last) bucket.last += per100;
  }

  /*
   * Tek aylık veri varsa "ilk ay / bu ay" karşılaştırması anlamsız —
   * ikisi aynı ay. Karşılaştırma yapılmıyor, ekran bunu söylüyor.
   */
  const singleMonth = first === last;

  return (Object.keys(FAMILIES) as Family[])
    .map((family) => {
      const bucket = totals.get(family)!;
      return {
        family,
        label: FAMILIES[family],
        firstMonth: bucket.first,
        lastMonth: bucket.last,
        // Azalma %20'den azsa inatçı sayılıyor.
        stuck: !singleMonth && bucket.first > 0 && bucket.last > bucket.first * 0.8,
      };
    })
    .filter((row) => row.firstMonth > 0 || row.lastMonth > 0);
}

export type StubbornCategory = {
  subcategory: Subcategory;
  label: string;
  total: number;
  recent: number;
};

/*
 * Hangi alt kategori HÂLÂ tekrar ediyor — bir sonraki tekrar setinin kaynağı.
 *
 * Sıralama önce son 30 güne bakıyor, sonra toplama. Sadece toplama bakmak
 * yanlış cevap veriyordu: aylar önce çözülmüş bir kategori, bir daha hiç
 * tekrarlamasa bile listenin başında kalıyordu — yani ekran "bunu çalış"
 * derken kullanıcının çoktan bitirdiği şeyi gösteriyordu.
 *
 * `recent = 0` olan satırlar dışarıda bırakılmıyor: çağıran taraf ikisini de
 * görüp neyi göstereceğine karar veriyor.
 */
export async function stubbornCategories(
  userId: string,
  limit = 6
): Promise<StubbornCategory[]> {
  const rows = (await db()`
    SELECT f.subcategory,
           count(*)::int AS total,
           count(*) FILTER (
             WHERE e.created_at > now() - interval '30 days'
           )::int AS recent
    FROM findings f
    JOIN entries e ON e.id = f.entry_id
    WHERE e.user_id = ${userId}
      AND (f.verdict IS NULL OR f.verdict = 'confirmed')
    GROUP BY f.subcategory
    ORDER BY count(*) FILTER (
             WHERE e.created_at > now() - interval '30 days'
           ) DESC,
           count(*) DESC
    LIMIT ${limit}
  `) as Array<{ subcategory: Subcategory; total: number; recent: number }>;

  return rows.map((row) => ({
    subcategory: row.subcategory,
    label: `${FAMILIES[SUBCATEGORIES[row.subcategory].family]} · ${SUBCATEGORIES[row.subcategory].label}`,
    total: row.total,
    recent: row.recent,
  }));
}

export type RepeatedTask = {
  taskId: string;
  prompt: string;
  level: Level;
  attempts: Array<{
    entryId: string;
    createdAt: Date;
    wordCount: number;
    findings: number;
    per100: number;
  }>;
};

/*
 * Aynı görevi birden fazla kez yazmış olanlar.
 *
 * Plan §08: "aynı görevin tekrarını işaretleme." İlerlemenin en okunabilir
 * kanıtı bu — aynı görev, aynı zorluk, farklı zaman.
 *
 * Tek sorgu: görev başına ayrı sorgu atmak N+1 olurdu.
 */
export async function repeatedTasks(userId: string): Promise<RepeatedTask[]> {
  const rows = (await db()`
    SELECT t.id::text   AS task_id,
           t.prompt,
           t.level,
           e.id::text   AS entry_id,
           e.created_at,
           e.word_count,
           count(f.id)::int AS findings
    FROM entries e
    JOIN tasks t ON t.id = e.task_id
    LEFT JOIN findings f
      ON f.entry_id = e.id
     AND (f.verdict IS NULL OR f.verdict = 'confirmed')
    WHERE e.user_id = ${userId}
      AND e.task_id IN (
        SELECT task_id FROM entries
        WHERE user_id = ${userId} AND task_id IS NOT NULL
        GROUP BY task_id HAVING count(*) > 1
      )
    GROUP BY t.id, t.prompt, t.level, e.id, e.created_at, e.word_count
    ORDER BY t.id, e.created_at
  `) as Array<{
    task_id: string;
    prompt: string;
    level: Level;
    entry_id: string;
    created_at: Date;
    word_count: number;
    findings: number;
  }>;

  const byTask = new Map<string, RepeatedTask>();
  for (const row of rows) {
    const existing = byTask.get(row.task_id) ?? {
      taskId: row.task_id,
      prompt: row.prompt,
      level: row.level,
      attempts: [],
    };
    existing.attempts.push({
      entryId: row.entry_id,
      createdAt: row.created_at,
      wordCount: row.word_count,
      findings: row.findings,
      per100: row.word_count === 0 ? 0 : (row.findings / row.word_count) * 100,
    });
    byTask.set(row.task_id, existing);
  }

  return [...byTask.values()];
}
