import "server-only";

import { cache } from "react";

import { db } from "./db";

/* Bağlamlar ve görevler — okuma tarafı. */

/*
 * Tipler `content-types.ts`'te: bu dosya `server-only` ve veritabanına
 * dokunuyor, ama tipler birim testlerinden de lazım.
 *
 * `DEFAULT_LEVEL` seviye motoru gelene kadar (Aşama 06) herkesin sayıldığı
 * seviye — tek yerde duruyor ki motor gelince değiştirilecek yer belli olsun.
 */
export {
  LEVELS,
  DEFAULT_LEVEL,
  type Level,
  type Context,
  type Task,
} from "./content-types.ts";

import type { Context, Level, Task } from "./content-types.ts";

export const listContexts = cache(async (): Promise<Context[]> => {
  const rows = (await db()`
    SELECT id::text AS id, slug, name, description
    FROM contexts
    ORDER BY sort_order
  `) as Array<{ id: string; slug: string; name: string; description: string }>;

  return rows;
});

export const findContextBySlug = cache(
  async (slug: string): Promise<Context | null> => {
    const rows = (await db()`
      SELECT id::text AS id, slug, name, description
      FROM contexts
      WHERE slug = ${slug}
      LIMIT 1
    `) as Array<Context>;

    return rows[0] ?? null;
  }
);

/*
 * Bir bağlam ve seviye için görev seçer.
 *
 * `exceptTaskId` "görevi değiştir" düğmesi için: aynı görevi tekrar vermesin.
 * Sıralama veritabanında rastgele — küçük tablo, `ORDER BY random()` burada
 * pahalı değil. Görev sayısı büyürse (binlerce) bu satır değişmeli.
 */
export async function pickTask(
  contextId: string,
  level: Level,
  exceptTaskId?: string
): Promise<Task | null> {
  const rows = (await db()`
    SELECT id::text          AS id,
           context_id::text  AS context_id,
           level,
           prompt,
           hint,
           min_words,
           max_words
    FROM tasks
    WHERE context_id = ${contextId}
      AND level = ${level}
      AND (${exceptTaskId ?? null}::bigint IS NULL OR id <> ${exceptTaskId ?? null}::bigint)
    ORDER BY random()
    LIMIT 1
  `) as Array<{
    id: string;
    context_id: string;
    level: Level;
    prompt: string;
    hint: string;
    min_words: number;
    max_words: number;
  }>;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    contextId: row.context_id,
    level: row.level,
    prompt: row.prompt,
    hint: row.hint,
    minWords: row.min_words,
    maxWords: row.max_words,
  };
}

export async function findTaskById(taskId: string): Promise<Task | null> {
  const rows = (await db()`
    SELECT id::text         AS id,
           context_id::text AS context_id,
           level, prompt, hint, min_words, max_words
    FROM tasks
    WHERE id = ${taskId}
    LIMIT 1
  `) as Array<{
    id: string;
    context_id: string;
    level: Level;
    prompt: string;
    hint: string;
    min_words: number;
    max_words: number;
  }>;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    contextId: row.context_id,
    level: row.level,
    prompt: row.prompt,
    hint: row.hint,
    minWords: row.min_words,
    maxWords: row.max_words,
  };
}
