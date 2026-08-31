"use server";

import { revalidatePath } from "next/cache";

import type { AnalysisState } from "./analysis-state";
import { findEntryForUser } from "./entries";
import { DEFAULT_LEVEL } from "./content-types";
import { findingsFor, latestAnalysis } from "./analyses";
import { runK1 } from "./k1/run";
import { runK2 } from "./k2/run";
import { getSessionUser } from "./session";
import { readField } from "./validation";

/*
 * "Analiz et" düğmesinin arkası.
 *
 * Sahiplik burada da ayrıca kontrol ediliyor: kaydı `findEntryForUser` ile
 * çekiyoruz, yani başkasının kaydı için analiz çalıştırılamıyor. Ekranın
 * düğmeyi göstermiyor olması bir sınır değil.
 */

export async function analyzeEntryAction(
  _prev: AnalysisState,
  formData: FormData
): Promise<AnalysisState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const entryId = readField(formData, "entryId");
  const entry = await findEntryForUser(entryId, user.id);
  if (!entry) return { ok: false, error: "Kayıt bulunamadı." };

  /*
   * BAŞARILI ÖLÇÜM VARSA TEKRAR KOŞULMUYOR — ve bu kontrol SUNUCUDA.
   *
   * Ekran zaten düğmeyi göstermiyor (`AutoAnalyze` yalnızca hiç koşum yokken
   * ya da son koşum patlamışken çiziliyor). Ama ekranın bir şeyi göstermiyor
   * olması bir sınır değil: bu bir server action ve doğrudan çağrılabiliyor.
   * Her çağrı gerçek bir model isteği, yani gerçek bir para.
   *
   * Kayıtlar zaten DEĞİŞMEZ — aynı metnin ikinci ölçümü aynı metni ölçer.
   * Yeniden koşmanın tek meşru sebebi öncekinin PATLAMIŞ olması, ve o durumda
   * `status = 'failed'` olduğu için buradan geçiyor.
   */
  const onceki = await latestAnalysis(entry.id, user.id, "K1");
  if (onceki?.status === "ok") {
    return {
      ok: false,
      error: "Bu kayıt zaten ölçüldü. Kayıtlar değişmiyor, ölçüm de değişmiyor.",
    };
  }

  const outcome = await runK1({
    entryId: entry.id,
    text: entry.body,
    // Seviye motoru Aşama 06'da; şimdilik görevin seviyesi, o da yoksa varsayılan.
    level: (entry.taskLevel as typeof DEFAULT_LEVEL | null) ?? DEFAULT_LEVEL,
    taskPrompt: entry.taskPrompt,
    taskHint: entry.taskHint,
  });

  if (!outcome.ok) {
    revalidatePath(`/entries/${entry.id}`);
    return { ok: false, error: outcome.reason };
  }

  /*
   * İkinci geçiş hemen ardından çalışıyor.
   *
   * Ayrı bir düğmeye bağlanmadı: doğrulanmamış bulguyu kullanıcıya göstermek,
   * doğrulama katmanını hiç yazmamakla neredeyse aynı şey. Plan §07 dördüncü
   * savunma bir seçenek değil, hattın parçası.
   *
   * İkinci geçiş patlarsa bulgular kararsız kalıyor (verdict NULL) ve ekranda
   * "doğrulanmadı" diye görünüyorlar — sessizce onaylanmış sayılmıyorlar.
   */
  const findings = await findingsFor(outcome.analysisId, user.id);
  const verified = await runK2({ text: entry.body, findings });

  revalidatePath(`/entries/${entry.id}`);

  if (!verified.ok) {
    return {
      ok: true,
      error: `Bulgular çıkarıldı ama ikinci geçiş yapılamadı: ${verified.reason}`,
    };
  }

  return { ok: true, error: null };
}
