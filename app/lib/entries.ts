import "server-only";

import { db } from "./db";

/*
 * Kayıtlar — okuma ve yazma.
 *
 * Kural: bu dosyadaki her fonksiyon `userId`'yi PARAMETRE olarak alır ve
 * sorgunun WHERE'ine koyar. Önce satırı çekip sonra "sahibi bu mu" diye
 * bakmak değil — sahiplik sorgunun kendisinde.
 *
 * Fark önemli: ikinci yöntemde bir dalı unutmak, başkasının kaydını
 * göstermek demek. Birincisinde unutulacak dal yok, sorgu zaten bulmuyor.
 * `userId` daima oturumdan gelir, hiçbir zaman formdan.
 */

export type EntrySummary = {
  id: string;
  createdAt: Date;
  wordCount: number;
  contextName: string;
  contextSlug: string;
  taskPrompt: string | null;
  /*
   * KAYDIN İLK SATIRI — kullanıcının kendi yazdığı metnin başı.
   *
   * Liste bugüne kadar yalnızca GÖREVİN metnini gösteriyordu ve aynı görevi
   * beş kez yazan biri beş özdeş satır görüyordu: "hangi kayıt hangisi"
   * sorusunun cevabı listede yoktu. Ayırt edici olan tek şey kişinin kendi
   * cümlesi.
   *
   * Tam gövde DEĞİL, ilk 140 karakter: liste sorgusu on sekiz kaydın tam
   * metnini taşımak zorunda kalmasın.
   */
  snippet: string;
  /** Doğrulanmış bulgu sayısı. Analiz yapılmamışsa null. */
  findings: number | null;
  /** 100 kelimede bulgu — listede tek karşılaştırılabilir sayı. */
  per100: number | null;
  /*
   * BU METNİN ölçülen seviyesi — görevin zorluğu değil.
   *
   * Tahmin kayıt anında, o metnin kendi K0 sinyallerinden hesaplanıp
   * `level_estimates` tablosuna `entry_id` ile yazılıyor. Bugüne kadar
   * yalnızca "kullanıcının güncel seviyesi" olarak okunuyordu; hangi metnin
   * hangi seviyede olduğu hiçbir yerde görünmüyordu.
   *
   * `null` = ölçülmedi (tahmin motorundan önceki eski kayıtlar, ya da o
   * koşumun patladığı kayıtlar). Bilinmeyen seviyeyi varsayılanla doldurmak
   * ölçüm gibi görünen bir uydurma olurdu.
   */
  level: string | null;
  /** Kısa metinde tahmin oynak. */
  levelReliable: boolean;
};

export type EntryDetail = EntrySummary & {
  body: string;
  taskId: string | null;
  taskHint: string | null;
  taskLevel: string | null;
};

type SummaryRow = {
  id: string;
  created_at: Date;
  word_count: number;
  context_name: string;
  context_slug: string;
  task_prompt: string | null;
  snippet: string;
  analyses: number;
  findings: number;
  level: string | null;
  level_reliable: boolean | null;
};

function toSummary(row: SummaryRow): EntrySummary {
  /*
   * Hiç analiz koşumu yoksa bulgu sayısı 0 değil BİLİNMİYOR. İkisini
   * karıştırmak, analiz edilmemiş bir kaydı "hatasız" göstermek olurdu.
   */
  const analysed = row.analyses > 0;

  return {
    id: row.id,
    createdAt: row.created_at,
    wordCount: row.word_count,
    contextName: row.context_name,
    contextSlug: row.context_slug,
    level: row.level,
    levelReliable: row.level_reliable === true,
    taskPrompt: row.task_prompt,
    snippet: row.snippet,
    findings: analysed ? row.findings : null,
    per100:
      analysed && row.word_count > 0
        ? (row.findings / row.word_count) * 100
        : null,
  };
}

export async function createEntry(input: {
  userId: string;
  contextId: string;
  taskId: string | null;
  body: string;
  wordCount: number;
}): Promise<string> {
  const rows = (await db()`
    INSERT INTO entries (user_id, context_id, task_id, body, word_count)
    VALUES (
      ${input.userId},
      ${input.contextId},
      ${input.taskId},
      ${input.body},
      ${input.wordCount}
    )
    RETURNING id::text AS id
  `) as Array<{ id: string }>;

  return rows[0].id;
}

export type ListFilters = {
  search?: string;
  contextSlug?: string;
  limit?: number;
};

export async function listEntries(
  userId: string,
  filters: ListFilters = {}
): Promise<EntrySummary[]> {
  const search = filters.search?.trim() || null;
  const contextSlug = filters.contextSlug?.trim() || null;
  const limit = filters.limit ?? 100;

  /*
   * Arama `websearch_to_tsquery` ile: kullanıcı "deposit landlord" yazarsa
   * ikisini birden arar, tırnak içi öbek arar, `-kelime` ile dışlar. Ve
   * kök buluyor — "meetings" yazınca "meeting" geçen kayıt da geliyor.
   *
   * Boş parametreler SQL'in içinde eleniyor; koşulu JavaScript'te metin
   * birleştirerek kurmak, tam olarak SQL enjeksiyonunun doğduğu yer olurdu.
   */
  const rows = (await db()`
    SELECT e.id::text     AS id,
           e.created_at,
           e.word_count,
           c.name         AS context_name,
           c.slug         AS context_slug,
           t.prompt       AS task_prompt,
           -- Kaydın kendi ilk satırı. Postgres left() karakter tabanlı, yani
           -- Türkçe ya da İngilizce fark etmiyor; kırpma işareti arayüzde.
           left(e.body, 140) AS snippet,
           (SELECT count(*)::int FROM analyses a
             WHERE a.entry_id = e.id AND a.status = 'ok') AS analyses,
           (SELECT count(*)::int FROM findings f
             WHERE f.entry_id = e.id
               AND (f.verdict IS NULL OR f.verdict = 'confirmed')) AS findings,
           -- Bu kaydın kendi seviye tahmini: entry_id ile bağlı, yani
           -- "kullanıcının o günkü seviyesi" değil, TAM OLARAK bu metnin
           -- ölçümü. Yoksa null — ölçülmemiş demek, varsayılan demek değil.
           (SELECT le.level FROM level_estimates le
             WHERE le.entry_id = e.id
             ORDER BY le.created_at DESC LIMIT 1) AS level,
           (SELECT le.reliable FROM level_estimates le
             WHERE le.entry_id = e.id
             ORDER BY le.created_at DESC LIMIT 1) AS level_reliable
    FROM entries e
    JOIN contexts c ON c.id = e.context_id
    LEFT JOIN tasks t ON t.id = e.task_id
    WHERE e.user_id = ${userId}
      AND (${contextSlug}::text IS NULL OR c.slug = ${contextSlug}::text)
      AND (
        ${search}::text IS NULL
        OR to_tsvector('english', e.body)
             @@ websearch_to_tsquery('english', ${search}::text)
      )
    ORDER BY e.created_at DESC
    LIMIT ${limit}
  `) as SummaryRow[];

  return rows.map(toSummary);
}

export async function countEntries(
  userId: string
): Promise<{ entries: number; words: number }> {
  const rows = (await db()`
    SELECT count(*)::int                     AS entries,
           coalesce(sum(word_count), 0)::int AS words
    FROM entries
    WHERE user_id = ${userId}
  `) as Array<{ entries: number; words: number }>;

  return rows[0];
}

export async function findEntryForUser(
  entryId: string,
  userId: string
): Promise<EntryDetail | null> {
  /*
   * `entryId` adres çubuğundan geliyor, yani kullanıcının kontrolünde.
   * Sayı olmayan bir değer sorguya girerse Postgres tip hatası verir; onu
   * hataya çevirmek yerine burada eliyoruz — /entries/abc "bulunamadı"
   * olmalı, "çöktü" değil.
   */
  if (!/^\d+$/.test(entryId)) return null;

  const rows = (await db()`
    SELECT e.id::text  AS id,
           e.created_at,
           e.word_count,
           e.body,
           e.task_id::text AS task_id,
           c.name      AS context_name,
           c.slug      AS context_slug,
           t.prompt    AS task_prompt,
           t.hint      AS task_hint,
           t.level     AS task_level,
           (SELECT count(*)::int FROM analyses a
             WHERE a.entry_id = e.id AND a.status = 'ok') AS analyses,
           (SELECT count(*)::int FROM findings f
             WHERE f.entry_id = e.id
               AND (f.verdict IS NULL OR f.verdict = 'confirmed')) AS findings,
           -- Bu kaydın kendi seviye tahmini: entry_id ile bağlı, yani
           -- "kullanıcının o günkü seviyesi" değil, TAM OLARAK bu metnin
           -- ölçümü. Yoksa null — ölçülmemiş demek, varsayılan demek değil.
           (SELECT le.level FROM level_estimates le
             WHERE le.entry_id = e.id
             ORDER BY le.created_at DESC LIMIT 1) AS level,
           (SELECT le.reliable FROM level_estimates le
             WHERE le.entry_id = e.id
             ORDER BY le.created_at DESC LIMIT 1) AS level_reliable
    FROM entries e
    JOIN contexts c ON c.id = e.context_id
    LEFT JOIN tasks t ON t.id = e.task_id
    WHERE e.id = ${entryId}
      AND e.user_id = ${userId}
    LIMIT 1
  `) as Array<
    SummaryRow & {
      body: string;
      task_id: string | null;
      task_hint: string | null;
      task_level: string | null;
    }
  >;

  const row = rows[0];
  if (!row) return null;

  return {
    ...toSummary(row),
    body: row.body,
    taskId: row.task_id,
    taskHint: row.task_hint,
    taskLevel: row.task_level,
  };
}

/* Aynı görevi daha önce yazmış mı — "şubatta da yazmıştın" rozeti için. */
export async function previousAttempts(
  userId: string,
  taskId: string,
  exceptEntryId: string
): Promise<EntrySummary[]> {
  const rows = (await db()`
    SELECT e.id::text AS id,
           e.created_at,
           e.word_count,
           c.name     AS context_name,
           c.slug     AS context_slug,
           t.prompt   AS task_prompt,
           (SELECT count(*)::int FROM analyses a
             WHERE a.entry_id = e.id AND a.status = 'ok') AS analyses,
           (SELECT count(*)::int FROM findings f
             WHERE f.entry_id = e.id
               AND (f.verdict IS NULL OR f.verdict = 'confirmed')) AS findings,
           -- Bu kaydın kendi seviye tahmini: entry_id ile bağlı, yani
           -- "kullanıcının o günkü seviyesi" değil, TAM OLARAK bu metnin
           -- ölçümü. Yoksa null — ölçülmemiş demek, varsayılan demek değil.
           (SELECT le.level FROM level_estimates le
             WHERE le.entry_id = e.id
             ORDER BY le.created_at DESC LIMIT 1) AS level,
           (SELECT le.reliable FROM level_estimates le
             WHERE le.entry_id = e.id
             ORDER BY le.created_at DESC LIMIT 1) AS level_reliable
    FROM entries e
    JOIN contexts c ON c.id = e.context_id
    JOIN tasks t ON t.id = e.task_id
    WHERE e.user_id = ${userId}
      AND e.task_id = ${taskId}
      AND e.id <> ${exceptEntryId}
    ORDER BY e.created_at DESC
    LIMIT 5
  `) as SummaryRow[];

  return rows.map(toSummary);
}
