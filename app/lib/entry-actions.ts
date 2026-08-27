"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { log } from "./log";

import { findContextBySlug, findTaskById } from "./content";
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
/** Görevsiz kayıtların bağlamı. `scripts/seed-data.mjs` ile aynı slug. */
const FREE_CONTEXT = "free";

const MIN_WORDS = 10;
const MAX_CHARS = 20000;

export async function saveEntryAction(
  _prev: SaveState,
  formData: FormData
): Promise<SaveState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const body = readField(formData, "body").trim();
  /*
   * Görev İSTEĞE BAĞLI.
   *
   * Ürün bugüne kadar yalnızca verilen görev üzerinden yazmaya izin
   * veriyordu; boş `taskId` "görev bulunamadı" hatasıyla dönüyordu. Oysa
   * insanların İngilizce yazma ihtiyacı çoğunlukla kendi konularında çıkıyor
   * — bir e-posta, bir mesaj, aklından geçen bir şey. Ölçüm aleti orada da
   * çalışmalı.
   *
   * Boş gelirse kayıt "Serbest" bağlamına, görevsiz yazılıyor. Ölçüm zinciri
   * değişmiyor: K0 metni zaten görevden bağımsız okuyor, model katmanının
   * istemi de görev satırlarını yalnızca VARSA ekliyor.
   */
  const taskId = readField(formData, "taskId").trim();

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
    /*
     * Bağlam İSTEMCİDEN ALINMIYOR. Görev varsa görevin kendisinden, yoksa
     * sunucudaki sabit "free" bağlamından okunuyor: istemci "hangi görev"
     * diyebilir, o görevin hangi bağlama ait olduğunu söyleyemez.
     */
    const task = taskId ? await findTaskById(taskId) : null;
    if (taskId && !task) {
      return { error: "Görev bulunamadı. Sayfayı yenileyip tekrar dene.", body };
    }

    const context = task ? null : await findContextBySlug(FREE_CONTEXT);
    if (!task && !context) {
      return { error: "Serbest bağlam bulunamadı — `npm run seed` gerekiyor.", body };
    }

    entryId = await createEntry({
      userId: user.id,
      contextId: task ? task.contextId : context!.id,
      taskId: task ? task.id : null,
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
      /*
       * KABUĞU DA TAZELE.
       *
       * Seviye cetveli `(app)/layout.tsx` içinde ve Next, aynı layout altındaki
       * gezinmede layout'u YENİDEN ÇİZMİYOR — `/write`ten `/entries/123`e
       * gidince kabuk ilk çizimdeki hâliyle kalıyor. Sonuç ÖLÇÜLDÜ: ilk kaydını
       * yazan kullanıcının tahmini veritabanına yazılıyor ama cetvelde hiçbir
       * bant yanmıyordu; ancak tam sayfa yenilemede görünüyordu.
       *
       * Ölçüm kabuk düzeyinde bir durum değiştirdiği için geçersiz kılınacak
       * olan da layout.
       */
      revalidatePath("/", "layout");
    } catch (error) {
      log.error("level_estimate_failed", error, { userId: user.id, entryId });
    }
  } catch (error) {
    log.error("entry_save_failed", error, { userId: user.id });
    return { error: "Kaydedilemedi. Biraz sonra tekrar dener misin?", body };
  }

  redirect(`/entries/${entryId}`);
}
