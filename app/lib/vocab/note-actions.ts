"use server";

import { revalidatePath } from "next/cache";

import { db } from "../db";
import { bandOf } from "../k0/bands";
import { getSessionUser } from "../session";
import { readField } from "../validation";

/*
 * Kelime defteri — yazma tarafı.
 *
 * İki kural, ikisi de sunucuda:
 *
 * 1. BANT İSTEMCİDEN GELMİYOR. Formda sadece kelime ve kaynağı var; seviye
 *    burada `bandOf()` ile hesaplanıyor. Aksi hâlde tarayıcıdan gönderilen bir
 *    değer ölçüme karışırdı — bu üründe en pahalı hata türü.
 *
 * 2. ÇAPA SAHİPLİĞİ SORGUDA KANITLANIYOR. `recordFeedbackAction` ile aynı
 *    kalıp: not, başkasının kaydına ya da bulgusuna bağlanamıyor.
 */

/** İngilizce tek kelime. Tire ve kesme işareti serbest ("state-of-the-art"). */
const WORD_SHAPE = /^[A-Za-z][A-Za-z'’-]{0,63}$/;

const SNIPPET_MAX = 400;

function cleanSnippet(raw: string): string | null {
  const s = raw.trim().replace(/\s+/g, " ");
  if (s.length === 0) return null;
  return s.length > SNIPPET_MAX ? `${s.slice(0, SNIPPET_MAX - 1)}…` : s;
}

export async function noteWordAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  const surface = readField(formData, "surface").trim();
  if (!WORD_SHAPE.test(surface)) return;

  const source = readField(formData, "source");
  if (source !== "task" && source !== "suggestion" && source !== "entry") return;

  const anchor = readField(formData, "anchorId");
  if (!/^\d+$/.test(anchor)) return;

  const word = surface.toLowerCase();
  const band = bandOf(word);
  const snippet = cleanSnippet(readField(formData, "snippet"));
  const back = readField(formData, "back");

  /*
   * Üç kaynağın üçü de sahipliği farklı bir zincirden kanıtlıyor:
   *   entry      → kayıt doğrudan kullanıcının
   *   suggestion → bulgu, kaydın üzerinden kullanıcının
   *   task       → görev herkese açık, doğrulanacak sahiplik yok
   *
   * `ON CONFLICT`: aynı kelime ikinci kez işaretlenirse yeni satır açılmıyor,
   * kaynağı ve tarihi tazeleniyor ve not tekrar AÇILIYOR — "yine takıldım"
   * demenin yolu bu.
   */
  if (source === "entry") {
    await db()`
      INSERT INTO word_notes
        (user_id, word, surface, band, source, source_entry_id, context_snippet)
      SELECT e.user_id, ${word}, ${surface}, ${band}, 'entry', e.id, ${snippet}
      FROM entries e
      WHERE e.id = ${anchor} AND e.user_id = ${user.id}
      ON CONFLICT (user_id, word) DO UPDATE
        SET surface = EXCLUDED.surface,
            source = EXCLUDED.source,
            source_entry_id = EXCLUDED.source_entry_id,
            source_finding_id = NULL,
            source_task_id = NULL,
            context_snippet = EXCLUDED.context_snippet,
            noted_at = now(),
            resolved_at = NULL
    `;
  } else if (source === "suggestion") {
    await db()`
      INSERT INTO word_notes
        (user_id, word, surface, band, source, source_finding_id, context_snippet)
      SELECT e.user_id, ${word}, ${surface}, ${band}, 'suggestion', f.id, ${snippet}
      FROM findings f
      JOIN entries e ON e.id = f.entry_id
      WHERE f.id = ${anchor} AND e.user_id = ${user.id}
      ON CONFLICT (user_id, word) DO UPDATE
        SET surface = EXCLUDED.surface,
            source = EXCLUDED.source,
            source_finding_id = EXCLUDED.source_finding_id,
            source_entry_id = NULL,
            source_task_id = NULL,
            context_snippet = EXCLUDED.context_snippet,
            noted_at = now(),
            resolved_at = NULL
    `;
  } else {
    await db()`
      INSERT INTO word_notes
        (user_id, word, surface, band, source, source_task_id, context_snippet)
      SELECT ${user.id}, ${word}, ${surface}, ${band}, 'task', t.id, ${snippet}
      FROM tasks t
      WHERE t.id = ${anchor}
      ON CONFLICT (user_id, word) DO UPDATE
        SET surface = EXCLUDED.surface,
            source = EXCLUDED.source,
            source_task_id = EXCLUDED.source_task_id,
            source_entry_id = NULL,
            source_finding_id = NULL,
            context_snippet = EXCLUDED.context_snippet,
            noted_at = now(),
            resolved_at = NULL
    `;
  }

  revalidatePath("/dashboard");
  if (back.startsWith("/") && !back.startsWith("//")) revalidatePath(back);
}

/*
 * "Artık biliyorum" / geri al.
 *
 * Bu bir ÖLÇÜM DEĞİL, kullanıcının kendi beyanı — ekranda da öyle yazıyor.
 * Rung bir kelimeyi bilip bilmediğini ölçemiyor; ölçebildiğini iddia etmek,
 * bu ürünün hiç yapmadığı şey.
 */
export async function resolveNoteAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  const id = readField(formData, "noteId");
  if (!/^\d+$/.test(id)) return;

  const open = readField(formData, "open") === "1";

  await db()`
    UPDATE word_notes
    SET resolved_at = ${open ? null : new Date()}
    WHERE id = ${id} AND user_id = ${user.id}
  `;

  revalidatePath("/dashboard");
}
