"use server";

import { redirect } from "next/navigation";

import { findTaskById } from "./content";
import { createEntry } from "./entries";
import type { SaveState } from "./save-state";
import { getSessionUser } from "./session";
import { readField } from "./validation";
import { countWords } from "./words";
import { analyze as analyzeK0 } from "./k0";
import { estimateLevel } from "./k3/estimate";
import { saveEstimate } from "./k3/store";

/*
 * Kaydetme.
 *
 * İki şey dikkat:
 *
 * 1. Oturum burada, ayrıca kontrol ediliyor. Sayfanın giriş yapmış birine
 *    çizilmiş olması bir güvenlik sınırı değil — server action'a arayüzden
 *    geçmeden de POST atılabiliyor.
 *
 * 2. Formdan sadece `taskId` ve metin geliyor. Bağlam (context) istemciden
 *    ALINMIYOR, görevin kendisinden okunuyor. İstemci "hangi görev" diyebilir;
 *    o görevin hangi bağlama ait olduğunu söyleyemez.
 */

/*
 * Ölçüm için taban. Bunun altında metin, seviye tahmini ve hata yoğunluğu
 * için anlamlı veri taşımıyor. Görevin kendi `min_words` değeri hedef olarak
 * gösteriliyor ama zorlanmıyor — kısa yazana "kaydetmiyorum" demek, yazmayı
 * bırakmasının en kısa yolu.
 */
const MIN_WORDS = 10;
const MAX_CHARS = 20000;

export async function saveEntryAction(
  _prev: SaveState,
  formData: FormData
): Promise<SaveState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const body = readField(formData, "body").trim();
  const taskId = readField(formData, "taskId");

  if (body.length === 0) {
    return { error: "Önce bir şeyler yaz.", body };
  }

  if (body.length > MAX_CHARS) {
    return { error: `Metin çok uzun — en fazla ${MAX_CHARS} karakter.`, body };
  }

  const wordCount = countWords(body);
  if (wordCount < MIN_WORDS) {
    return {
      error: `Ölçüm için en az ${MIN_WORDS} kelime gerekiyor — şu an ${wordCount}.`,
      body,
    };
  }

  let entryId: string;
  try {
    const task = await findTaskById(taskId);
    if (!task) {
      return { error: "Görev bulunamadı. Sayfayı yenileyip tekrar dene.", body };
    }

    entryId = await createEntry({
      userId: user.id,
      contextId: task.contextId, // istemciden değil, görevden
      taskId: task.id,
      body,
      wordCount,
    });

    /*
     * Seviye tahmini her yeni kayıttan sonra güncelleniyor (plan §06:
     * "tahmin sürekli güncellenir"). K0'a dayanıyor, model kullanmıyor —
     * yani kaydetme akışını yavaşlatmıyor ve para harcamıyor.
     *
     * Tahmin başarısız olursa kayıt yine de duruyor: metni saklamak asıl iş,
     * tahmin türevi. Bir sonraki kayıtta yeniden hesaplanacak.
     */
    try {
      const k0 = analyzeK0(body);
      const estimate = estimateLevel(
        body,
        k0.findings.map((f) => f.subcategory)
      );
      await saveEstimate({
        userId: user.id,
        entryId,
        level: estimate.level,
        score: estimate.score,
        signals: estimate.signals,
        reliable: estimate.reliable,
      });
    } catch (error) {
      console.error("[rung] seviye tahmini güncellenemedi:", error);
    }
  } catch (error) {
    console.error("[rung] kayıt yazılırken hata:", error);
    return { error: "Kaydedilemedi. Biraz sonra tekrar dener misin?", body };
  }

  redirect(`/entries/${entryId}`);
}
