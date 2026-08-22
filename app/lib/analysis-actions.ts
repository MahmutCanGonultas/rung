"use server";

import { revalidatePath } from "next/cache";

import type { AnalysisState } from "./analysis-state";
import { findEntryForUser } from "./entries";
import { DEFAULT_LEVEL } from "./content-types";
import { runK1 } from "./k1/run";
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

  const outcome = await runK1({
    entryId: entry.id,
    text: entry.body,
    // Seviye motoru Aşama 06'da; şimdilik görevin seviyesi, o da yoksa varsayılan.
    level: (entry.taskLevel as typeof DEFAULT_LEVEL | null) ?? DEFAULT_LEVEL,
    taskPrompt: entry.taskPrompt,
    taskHint: entry.taskHint,
  });

  revalidatePath(`/entries/${entry.id}`);

  if (!outcome.ok) return { ok: false, error: outcome.reason };
  return { ok: true, error: null };
}
