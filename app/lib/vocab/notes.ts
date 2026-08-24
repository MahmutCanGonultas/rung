import "server-only";

import { db } from "../db";
import type { Band } from "../k0/bands";

/*
 * Kelime defterinin okuma tarafı.
 *
 * Defterin ne OLMADIĞI, ne olduğu kadar önemli: bu liste Rung'ın "şu kelimeyi
 * bilmiyorsun" ölçümü DEĞİL. Öyle bir ölçüm yapılmıyor. Liste tamamen
 * kullanıcının kendi işaretlediklerinden oluşuyor ve ekran bunu yazıyor.
 */

export type WordNote = {
  id: string;
  word: string;
  surface: string;
  band: Band;
  source: "task" | "suggestion" | "entry";
  contextSnippet: string | null;
  notedAt: Date;
  resolved: boolean;
  /** Kaynağa geri dönmek için — kaynak silinmişse null. */
  entryId: string | null;
};

type Row = {
  id: string;
  word: string;
  surface: string;
  band: Band;
  source: WordNote["source"];
  context_snippet: string | null;
  noted_at: Date;
  resolved_at: Date | null;
  entry_id: string | null;
};

function toNote(row: Row): WordNote {
  return {
    id: row.id,
    word: row.word,
    surface: row.surface,
    band: row.band,
    source: row.source,
    contextSnippet: row.context_snippet,
    notedAt: row.noted_at,
    resolved: row.resolved_at !== null,
    entryId: row.entry_id,
  };
}

/*
 * Açık notlar önce, sonra kapatılanlar. İçlerinde en yeni üstte.
 *
 * `source_finding_id` üzerinden de kayda ulaşılabiliyor: öneriden gelen bir
 * notun bağlamı, o bulgunun bulunduğu kayıt.
 */
export async function listNotes(
  userId: string,
  limit = 40
): Promise<WordNote[]> {
  const rows = (await db()`
    SELECT n.id::text AS id,
           n.word,
           n.surface,
           n.band,
           n.source,
           n.context_snippet,
           n.noted_at,
           n.resolved_at,
           COALESCE(n.source_entry_id, f.entry_id)::text AS entry_id
    FROM word_notes n
    LEFT JOIN findings f ON f.id = n.source_finding_id
    WHERE n.user_id = ${userId}
    ORDER BY (n.resolved_at IS NOT NULL), n.noted_at DESC
    LIMIT ${limit}
  `) as Row[];

  return rows.map(toNote);
}

/** Defterin özeti — pano başlığında tek satır. */
export async function noteCounts(
  userId: string
): Promise<{ open: number; resolved: number }> {
  const rows = (await db()`
    SELECT count(*) FILTER (WHERE resolved_at IS NULL)::int     AS open,
           count(*) FILTER (WHERE resolved_at IS NOT NULL)::int AS resolved
    FROM word_notes
    WHERE user_id = ${userId}
  `) as Array<{ open: number; resolved: number }>;

  return rows[0] ?? { open: 0, resolved: 0 };
}

/** Bir kaydın metninde hangi kelimeler zaten deftere alınmış. */
export async function notedWords(userId: string): Promise<Set<string>> {
  const rows = (await db()`
    SELECT word FROM word_notes WHERE user_id = ${userId}
  `) as Array<{ word: string }>;

  return new Set(rows.map((r) => r.word));
}
