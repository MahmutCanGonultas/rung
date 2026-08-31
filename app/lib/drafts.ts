import "server-only";

import { db } from "./db";

/*
 * Taslaklar — bitmemiş metinler.
 *
 * `entries.ts` ile aynı kural: her fonksiyon `userId`'yi PARAMETRE olarak
 * alıyor ve sorgunun WHERE'ine koyuyor. Sahiplik sorgunun kendisinde, sonradan
 * yapılan bir kontrolde değil.
 *
 * `entries`ten farkı tek cümlede: kayıt DEĞİŞMEZ, taslak DEĞİŞİR. O yüzden
 * ayrı tablo (bkz. `migrations/0013`), o yüzden `updated_at` var, ve o yüzden
 * silmek normal bir iş — kayıt silmek istisna.
 */

/**
 * En fazla kaç taslak.
 *
 * Tablodaki kısıt zaten "her yazma durumuna bir taslak" diyor, yani normal
 * kullanımda sayı görev sayısıyla sınırlı. Bu tavan o normali değil, arayüzden
 * geçmeden doğrudan çağrılan bir server action'ı düşünüyor.
 */
export const MAX_DRAFTS = 20;

/**
 * Bu kadar gün dokunulmamış taslak ESKİ sayılıyor.
 *
 * Silinmiyor — kimsenin yazdığı sessizce yok olmaz. Ekranda yaşı söyleniyor,
 * çünkü ölçüm "şu anki hâlin" iddiasında: üç hafta önce başlanmış bir metni
 * bugün gönderirken, o metnin bugünkü sen olmayabileceğini bilmek gerekiyor.
 */
export const STALE_DAYS = 7;

export type Draft = {
  id: string;
  body: string;
  /** `null` = kendi konusunda yazılıyor, görev yok. */
  taskId: string | null;
  taskPrompt: string | null;
  contextName: string;
  contextSlug: string;
  createdAt: Date;
  updatedAt: Date;
};

/*
 * Satırı tipe çevirirken GÖVDE VAR MI diye bakılıyor ve yoksa hata SORGUYU
 * SÖYLÜYOR. Bu projede tam olarak bu kusur bir kez canlıya çıktı: iki ayrı
 * sorgudan birinde `AS snippet` unutulmuştu, alan sessizce `undefined` geldi
 * ve kayıt ekranı çöktü. Aynı hatayı burada yakalayacak olan bu.
 */
function toDraft(r: unknown, sorgu: string): Draft {
  const d = r as Partial<Draft>;
  if (typeof d.body !== "string") {
    throw new Error(`${sorgu}: sorgu \`body\` döndürmedi — SELECT listesi bozuk`);
  }
  return d as Draft;
}

/**
 * Bu kullanıcının BU yazma durumundaki taslağı. `taskId` null = kendi konusu.
 *
 * `IS NOT DISTINCT FROM` kullanılıyor, `=` değil: `task_id = NULL` hiçbir
 * satır bulmuyor ve "kendi konum" taslağı hiç okunmuyor. Tablodaki tekillik
 * kısıtı da aynı mantıkta (`UNIQUE NULLS NOT DISTINCT`).
 */
export async function findDraft(
  userId: string,
  taskId: string | null
): Promise<Draft | null> {
  if (taskId !== null && !/^\d+$/.test(taskId)) return null;

  const rows = (await db()`
    SELECT d.id::text        AS id,
           d.body            AS body,
           d.task_id::text   AS "taskId",
           t.prompt          AS "taskPrompt",
           c.name            AS "contextName",
           c.slug            AS "contextSlug",
           d.created_at      AS "createdAt",
           d.updated_at      AS "updatedAt"
    FROM drafts d
    JOIN contexts c ON c.id = d.context_id
    LEFT JOIN tasks t ON t.id = d.task_id
    WHERE d.user_id = ${userId}
      AND d.task_id IS NOT DISTINCT FROM ${taskId}
  `) as unknown[];

  return rows[0] ? toDraft(rows[0], "findDraft") : null;
}

/** Taslaklar, en son dokunulandan geriye. */
export async function listDrafts(userId: string): Promise<Draft[]> {
  const rows = (await db()`
    SELECT d.id::text        AS id,
           d.body            AS body,
           d.task_id::text   AS "taskId",
           t.prompt          AS "taskPrompt",
           c.name            AS "contextName",
           c.slug            AS "contextSlug",
           d.created_at      AS "createdAt",
           d.updated_at      AS "updatedAt"
    FROM drafts d
    JOIN contexts c ON c.id = d.context_id
    LEFT JOIN tasks t ON t.id = d.task_id
    WHERE d.user_id = ${userId}
    ORDER BY d.updated_at DESC
    LIMIT ${MAX_DRAFTS}
  `) as unknown[];

  return rows.map((r) => toDraft(r, "listDrafts"));
}

/**
 * Taslağı yaz ya da üstüne yaz.
 *
 * `ON CONFLICT` tablodaki tekillik kısıtına düşüyor: aynı yazma durumunun
 * ikinci bir taslağı olmuyor, ikinci yazış birincinin üstüne biniyor.
 *
 * TAVAN KONTROLÜ EKLEMEDEN ÖNCE var olan satır aranıyor: kişi zaten tavana
 * dayanmışsa bile MEVCUT taslağını güncelleyebilmeli — yoksa yirmi taslağı
 * olan biri hiçbirine yazamaz hâle gelir.
 */
export async function upsertDraft(d: {
  userId: string;
  contextId: string;
  taskId: string | null;
  body: string;
}): Promise<Date> {
  const mevcut = await findDraft(d.userId, d.taskId);
  if (!mevcut) {
    const rows = (await db()`
      SELECT count(*)::int AS n FROM drafts WHERE user_id = ${d.userId}
    `) as Array<{ n: number }>;
    if ((rows[0]?.n ?? 0) >= MAX_DRAFTS) {
      throw new Error(`taslak tavanı: en fazla ${MAX_DRAFTS}`);
    }
  }

  const rows = (await db()`
    INSERT INTO drafts (user_id, context_id, task_id, body)
    VALUES (${d.userId}, ${d.contextId}, ${d.taskId}, ${d.body})
    ON CONFLICT (user_id, task_id) DO UPDATE
      SET body       = EXCLUDED.body,
          context_id = EXCLUDED.context_id,
          updated_at = now()
    RETURNING updated_at AS "updatedAt"
  `) as Array<{ updatedAt: Date }>;

  return rows[0].updatedAt;
}

/** Yazma durumunun taslağını sil. Yoksa sessiz. */
export async function deleteDraft(
  userId: string,
  taskId: string | null
): Promise<void> {
  if (taskId !== null && !/^\d+$/.test(taskId)) return;
  await db()`
    DELETE FROM drafts
    WHERE user_id = ${userId}
      AND task_id IS NOT DISTINCT FROM ${taskId}
  `;
}

/** Kaç taslak var. Kayıtlar ekranı başlığı için. */
export async function countDrafts(userId: string): Promise<number> {
  const rows = (await db()`
    SELECT count(*)::int AS n FROM drafts WHERE user_id = ${userId}
  `) as Array<{ n: number }>;
  return rows[0]?.n ?? 0;
}

/** Kaç gündür dokunulmamış. Ekranda yaşı söylemek için. */
export function draftAgeDays(d: Draft, now = new Date()): number {
  return Math.floor((now.getTime() - d.updatedAt.getTime()) / 86_400_000);
}
