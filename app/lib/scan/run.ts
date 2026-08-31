import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { PRICING, costOf, type ModelId } from "../k1/anthropic-provider.ts";
import { log } from "../log.ts";
import {
  SYSTEM_PROMPT,
  ScanSchema,
  USER_PROMPT,
  type ImageType,
  type ScanResult,
} from "./contract.ts";

/*
 * Fotoğraftan metin — model çağrısı.
 *
 * K1 sağlayıcısı yeniden kullanılmıyor: o `complete(request)` ile DÜZ METİN
 * alıyor, buradaki istek ise bir GÖRSEL bloğu taşıyor. Arayüzü görsel
 * taşıyacak şekilde genişletmek, ölçüm katmanının sözleşmesini ölçümle
 * ilgisi olmayan bir iş için bozmak olurdu. Fiyat tablosu ve maliyet
 * hesabı ise paylaşılıyor — orası tek kaynak.
 */

/*
 * VARSAYILAN MODEL K1 İLE AYNI SEVİYEDE, ve bu bilinçli bir maliyet kararı.
 *
 * Daha ucuz bir modele inmek burada doğrudan ÖLÇÜMÜ bozar: yanlış okunan bir
 * kelime, kişinin yapmadığı bir hata olarak ekrana gelir. Yanlış alarmın
 * pahalı olduğu bir üründe, girdiyi ucuzlatmak en yanlış yerden kısmak olur.
 *
 * Yine de ortam değişkeninden okunuyor — bu projede "hangi model yeterli"
 * sorusunun cevabı tahminle değil ölçümle veriliyor.
 */
export const DEFAULT_SCAN_MODEL: ModelId = "claude-sonnet-5";

export function scanModel(): ModelId {
  const raw = process.env.RUNG_SCAN_MODEL;
  if (raw && raw in PRICING) return raw as ModelId;
  return DEFAULT_SCAN_MODEL;
}

export type ScanRun = ScanResult & { costUsd: number; durationMs: number };

export async function transcribe(
  base64: string,
  mediaType: ImageType
): Promise<ScanRun> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY tanımlı değil");

  const client = new Anthropic({ apiKey: key });
  const model = scanModel();
  const startedAt = Date.now();

  const response = await client.messages.parse({
    model,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: USER_PROMPT },
        ],
      },
    ],
    /*
     * Çaba DÜŞÜK. El yazısı okumak uzun akıl yürütme değil dikkatli okuma; ve
     * çıktı token'ı girdinin beş katı fiyatta. Yetip yetmediği ölçülecek bir
     * soru, o yüzden değişken.
     */
    thinking: { type: "adaptive" },
    output_config: {
      effort: process.env.RUNG_SCAN_EFFORT === "medium" ? "medium" : "low",
      format: zodOutputFormat(ScanSchema),
    },
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Model fotoğrafı çevirmeyi reddetti.");
  }

  const parsed = response.parsed_output;
  if (!parsed) throw new Error("Model şemaya uygun cevap üretmedi.");

  const costUsd = costOf(
    model,
    response.usage.input_tokens,
    response.usage.output_tokens
  );

  /*
   * MALİYET GÜNLÜĞE YAZILIYOR, VERİTABANINA DEĞİL — ve bu bilinçli bir eksik.
   *
   * Doğruluk panosundaki "kayıt başı maliyet" `analyses` tablosundan geliyor
   * ve yalnızca ölçüm çağrılarını sayıyor. Fotoğraf çevirisi de para
   * harcıyor, yani o sayı bugün gerçek maliyetin TAMAMI değil. Sayıyı sessizce
   * eksik göstermektense burada durumu yazmak doğru; kendi tablosu
   * `docs/plan.md` "Hâlâ açık" listesinde.
   */
  log.info("scan_done", {
    model,
    costUsd: Number(costUsd.toFixed(6)),
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    legible: parsed.legible,
    chars: parsed.text.length,
    uncertain: parsed.uncertain.length,
  });

  return { ...parsed, costUsd, durationMs: Date.now() - startedAt };
}
