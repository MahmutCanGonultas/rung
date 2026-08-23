import "server-only";

import { saveAnalysis } from "../analyses";
import { analyze as analyzeK0 } from "../k0";
import type { Level } from "../content-types";
import { AnthropicProvider, hasApiKey } from "./anthropic-provider";
import {
  PROMPT_VERSION,
  RawResponseSchema,
  validate,
  type RawResponse,
} from "./contract";
import { FakeProvider } from "./fake-provider";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import { ProviderError, type Provider } from "./provider";

/*
 * K1 koşumu: metni modele verip bulguları saklar.
 *
 * K0 önce çalışıyor ve bulduklarını modele "bunları tekrar etme" diye
 * veriyor. Plan §07 üçüncü savunma: "Modele sadece yorum gerektiren kısım
 * gider." Bunun iki faydası var — para ve gürültü.
 */

/*
 * Sağlayıcı seçimi.
 *
 * Anahtar yoksa SESSİZCE sahteye düşmüyoruz: ölçümü olan bir üründe uydurma
 * sonucu gerçek gibi saklamak yapılabilecek en kötü şey. Sahte sağlayıcı
 * yalnızca `RUNG_FAKE_MODEL=1` ile, yani biri onu bilerek istediğinde
 * devreye giriyor — ve ürettiği kayıt `model_id` alanında "fake-model-v1"
 * yazdığı için sonradan da ayırt edilebiliyor.
 */
function pickProvider(): Provider {
  if (process.env.RUNG_FAKE_MODEL === "1") return new FakeProvider();
  return new AnthropicProvider();
}

export type RunOutcome =
  | { ok: true; analysisId: string; findingCount: number; rejectedCount: number }
  | { ok: false; reason: string; kind: ProviderError["kind"] | "unknown" };

export async function runK1(input: {
  entryId: string;
  text: string;
  level: Level;
  taskPrompt: string | null;
  taskHint: string | null;
}): Promise<RunOutcome> {
  /*
   * Anahtar yoksa koşum KAYDEDİLMİYOR — bilerek.
   *
   * "Anahtar tanımlı değil" bir model başarısızlığı değil, bir yapılandırma
   * eksiği. `analyses` tablosundaki başarısız satırlar Aşama 05'te modelin ne
   * sıklıkla patladığını ölçmek için kullanılacak; oraya yapılandırma
   * hatalarını karıştırmak o ölçümü yalancı yapar.
   */
  if (!hasApiKey() && process.env.RUNG_FAKE_MODEL !== "1") {
    return {
      ok: false,
      kind: "no_key",
      reason:
        "Model katmanı için API anahtarı gerekiyor. ANTHROPIC_API_KEY tanımlı değil.",
    };
  }

  const k0 = analyzeK0(input.text);

  const request = {
    system: SYSTEM_PROMPT,
    user: buildUserMessage({
      text: input.text,
      level: input.level,
      taskPrompt: input.taskPrompt,
      taskHint: input.taskHint,
      alreadyFound: k0.findings.map((f) => f.original),
    }),
    schema: RawResponseSchema,
  };

  let provider: Provider;
  try {
    provider = pickProvider();
  } catch (error) {
    const kind = error instanceof ProviderError ? error.kind : "unknown";
    const reason = error instanceof Error ? error.message : "Sağlayıcı kurulamadı.";
    return { ok: false, kind, reason };
  }

  try {
    const result = await provider.complete(request);
    const { findings, rejected } = validate(
      input.text,
      result.parsed as RawResponse
    );

    /*
     * Elenen bulgular da kayda giriyor — sayı olarak, `error` alanında.
     * Eleme oranı modelin ne sıklıkla uydurduğunu gösteriyor ve Aşama 05'te
     * prompt sürümlerini karşılaştırmanın girdilerinden biri olacak.
     */
    const analysisId = await saveAnalysis({
      entryId: input.entryId,
      layer: "K1",
      modelId: result.modelId,
      promptVersion: PROMPT_VERSION,
      status: "ok",
      error:
        rejected.length > 0
          ? `elenen ${rejected.length} bulgu: ${rejected
              .map((r) => r.reason)
              .join(" | ")
              .slice(0, 500)}`
          : null,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      costUsd: result.usage.costUsd,
      durationMs: result.durationMs,
      findings,
    });

    return {
      ok: true,
      analysisId,
      findingCount: findings.length,
      rejectedCount: rejected.length,
    };
  } catch (error) {
    const kind = error instanceof ProviderError ? error.kind : "unknown";
    const reason =
      error instanceof Error ? error.message : "Model çağrısı başarısız oldu.";

    console.error("[rung] K1 koşumu başarısız:", error);

    // Başarısız koşum da saklanıyor: neyin ne zaman patladığı ölçülebilir olmalı.
    await saveAnalysis({
      entryId: input.entryId,
      layer: "K1",
      modelId: null,
      promptVersion: PROMPT_VERSION,
      status: "failed",
      error: reason.slice(0, 500),
      inputTokens: null,
      outputTokens: null,
      costUsd: null,
      durationMs: null,
      findings: [],
    }).catch(() => {
      /* kayıt da yazılamıyorsa yapacak bir şey yok */
    });

    return { ok: false, kind, reason };
  }
}
