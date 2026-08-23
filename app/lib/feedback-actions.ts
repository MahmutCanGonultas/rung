"use server";

import { revalidatePath } from "next/cache";

import { db } from "./db";
import { getSessionUser } from "./session";
import { readField } from "./validation";

/*
 * İtiraz döngüsü — plan §07 beşinci savunma.
 *
 * "Kullanıcı katılmadığı düzeltmeyi işaretler. O itirazlar altın kümeyi
 * kendiliğinden büyütür."
 *
 * Bu düğme bir nezaket jesti değil, **eval'in ham verisi**. Kullanıcının
 * "bu hata değil" dediği her bulgu, sistemin yanlış alarm verdiği bir örnek
 * demek — ve yanlış alarm bu projenin ana ölçütü.
 */

export async function recordFeedbackAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  const findingId = readField(formData, "findingId");
  const agreed = readField(formData, "agreed") === "1";
  const entryId = readField(formData, "entryId");

  if (!/^\d+$/.test(findingId)) return;

  /*
   * Sahiplik: bulgu, kaydın üzerinden kullanıcıya bağlı. Sorgu o zinciri
   * kuruyor, yani başkasının bulgusuna itiraz kaydedilemiyor.
   *
   * `ON CONFLICT ... DO UPDATE`: kullanıcı fikrini değiştirebilir, ikinci
   * satır oluşmuyor.
   */
  await db()`
    INSERT INTO finding_feedback (finding_id, user_id, agreed)
    SELECT f.id, e.user_id, ${agreed}
    FROM findings f
    JOIN entries e ON e.id = f.entry_id
    WHERE f.id = ${findingId}
      AND e.user_id = ${user.id}
    ON CONFLICT (finding_id, user_id)
    DO UPDATE SET agreed = EXCLUDED.agreed, created_at = now()
  `;

  if (/^\d+$/.test(entryId)) revalidatePath(`/entries/${entryId}`);
}
