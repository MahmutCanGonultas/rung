"use server";

import { revalidatePath } from "next/cache";

import { findContextBySlug, findTaskById } from "./content";
import { deleteDraft, upsertDraft } from "./drafts";
import { log } from "./log";
import { getSessionUser } from "./session";

/*
 * TASLAK EYLEMLERİ.
 *
 * `entry-actions.ts` ile aynı iki kural geçerli:
 *
 * 1. Oturum burada, ayrıca okunuyor. Sayfanın giriş yapmış birine çizilmiş
 *    olması bir güvenlik sınırı değil — server action'a arayüzden geçmeden de
 *    istek atılabiliyor.
 *
 * 2. Bağlam İSTEMCİDEN ALINMIYOR, görevden okunuyor. İstemci "hangi görev"
 *    diyebilir; o görevin hangi bağlama ait olduğunu söyleyemez.
 *
 * FARKI: otomatik kayıt SESSİZ. Kişi yazarken her duraklamada çağrılıyor, o
 * yüzden yönlendirmiyor ve `revalidatePath` ÇAĞIRMIYOR. Tek döndürdüğü şey
 * "kaydedildi mi, ne zaman".
 *
 * `revalidatePath` BİR KEZ DENENDİ VE YAZIYI BOZDU. Bir server action yolu
 * geçersiz kıldığında Next yalnızca o yolu değil, İSTEMCİDEKİ AÇIK AĞACI da
 * tazeliyor — yani kişi yazarken yazma ekranı yeniden çiziliyor ve alanın
 * içeriği sunucudan gelen taslakla değişiyor. ÖLÇÜLDÜ: duman testinde
 * kaydedilen gövde iki metnin birbirine karışmış hâliydi ("metin olduğu gibi
 * duruyor" düştü, temiz cümlede beş kural bulgusu çıktı).
 *
 * Kayıtlar ekranının tazeliği bunun karşılığında feda ediliyor ve bedeli yok:
 * o ekran zaten oturuma bağlı, yani her istekte yeniden çiziliyor.
 */

/** Görevsiz taslakların bağlamı. `entry-actions.ts` ile aynı slug. */
const FREE_CONTEXT = "free";
const MAX_CHARS = 20000;

export type DraftSave =
  | { ok: true; savedAt: string; empty: boolean }
  | { ok: false; error: string };

export async function saveDraftAction(
  taskId: string,
  body: string
): Promise<DraftSave> {
  const user = await getSessionUser();
  /*
   * Oturum düşmüşse SESSİZCE dönülüyor, yönlendirme yok: otomatik kayıt
   * kişinin yazdığı sırada arka planda çalışıyor ve oradan gelen bir
   * `redirect`, kişiyi yazarken sayfadan atardı.
   */
  if (!user) return { ok: false, error: "oturum yok" };

  const text = body.trim();

  if (text.length > MAX_CHARS) {
    return { ok: false, error: `Taslak çok uzun — en fazla ${MAX_CHARS} karakter.` };
  }

  const task = taskId.trim();

  /*
   * BOŞALTMAK SİLMEKTİR.
   *
   * Alanı temizleyen kişi "bunu istemiyorum" demiş oluyor. Boş bir taslağı
   * saklamak hem tablodaki `length(body) >= 1` kısıtını çiğnerdi hem de
   * kayıtlar ekranında içi boş bir satır bırakırdı.
   */
  if (text.length === 0) {
    try {
      await deleteDraft(user.id, task || null);
    } catch (error) {
      log.error("draft_delete_failed", error, { userId: user.id });
      return { ok: false, error: "Taslak silinemedi." };
    }
    return { ok: true, savedAt: new Date().toISOString(), empty: true };
  }

  try {
    const found = task ? await findTaskById(task) : null;
    if (task && !found) return { ok: false, error: "Görev bulunamadı." };

    const context = found ? null : await findContextBySlug(FREE_CONTEXT);
    if (!found && !context) return { ok: false, error: "Serbest bağlam yok." };

    const savedAt = await upsertDraft({
      userId: user.id,
      contextId: found ? found.contextId : context!.id,
      taskId: found ? found.id : null,
      body: text,
    });

    return { ok: true, savedAt: savedAt.toISOString(), empty: false };
  } catch (error) {
    log.error("draft_save_failed", error, { userId: user.id });
    return { ok: false, error: "Taslak kaydedilemedi." };
  }
}

/** Taslağı at. Kayıtlar ekranındaki ve yazma ekranındaki düğme buraya geliyor. */
export async function discardDraftAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  const raw = formData.get("taskId");
  const taskId = typeof raw === "string" ? raw.trim() : "";

  try {
    await deleteDraft(user.id, taskId || null);
  } catch (error) {
    log.error("draft_discard_failed", error, { userId: user.id });
    return;
  }

  revalidatePath("/history");
  revalidatePath("/write");
}
