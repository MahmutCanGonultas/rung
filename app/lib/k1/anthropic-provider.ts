import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import {
  ProviderError,
  type ModelRequest,
  type ModelResult,
  type Provider,
} from "./provider.ts";

/*
 * Gerçek model sağlayıcısı.
 *
 * Yapılandırılmış çıktı (`output_config.format`) kullanılıyor: model şemanın
 * dışına çıkamıyor, serbest metin döndüremiyor. Plan §07 ikinci savunma
 * ("şema zorlaması") tam olarak bu satır.
 *
 * Şemaya uymak biçim garantisi veriyor, doğruluk garantisi vermiyor — modelin
 * metinde geçmeyen bir parça uydurması hâlâ mümkün. Onu `contract.validate`
 * eliyor: her bulgu metinde aranıyor, bulunamayan gösterilmiyor.
 */

/*
 * Fiyatlar 1 milyon token başına, dolar (22 Ağustos 2026).
 *
 * Maliyet her koşumla birlikte veritabanına yazılıyor — doğruluk panosundaki
 * "kayıt başı maliyet" buradan geliyor. Fiyat değişirse burası güncellenir;
 * geçmiş kayıtlar o günkü fiyatla hesaplanmış hâlleriyle kalır, geriye dönük
 * değişmez. Ölçümün anlamı buna bağlı.
 */
export const PRICING = {
  "claude-opus-5": { input: 5.0, output: 25.0 },
  "claude-sonnet-5": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
} as const;

export type ModelId = keyof typeof PRICING;

/*
 * Varsayılan model — 23 Ağustos 2026 kararı, gerekçe docs/plan.md §15.
 *
 * Kısaca: bu görev serbest metin üretmiyor, sabit taksonomiye ve zorunlu
 * şemaya yazıyor; kafesi K0 ve doğrulama katmanı zaten kuruyor. Sonnet 5 bu
 * kafeste yeterli, ve ayda 100 kayıtta ~$2. Opus 5'e çıkmak ayda ~$1,30 daha
 * pahalı; haiku'ya inmek ~63 sent daha ucuz — ikisi de kararı belirleyecek
 * kadar büyük farklar değil, o yüzden seçim maliyete göre değil ölçüme
 * bırakılacak duruma göre yapıldı: TEK model, TEK değişken. Aşama 05'in
 * eval'i katman katman değiştirip sayıyla karşılaştıracak.
 */
export const DEFAULT_MODEL: ModelId = "claude-sonnet-5";

/*
 * Model ve çaba ORTAM DEĞİŞKENİNDEN okunuyor, koda gömülü değil.
 *
 * Sebep bu projenin ana tezi: hangi modelin yeterli olduğu tahminle değil
 * ölçümle bilinir. Aşama 05'in eval'i aynı altın kümeyi farklı modellerle
 * koşturup sayılarla karşılaştıracak; bunun mümkün olması için modelin
 * çalışma anında değişebilmesi gerekiyor.
 */
export function configuredModel(): ModelId {
  const raw = process.env.RUNG_K1_MODEL;
  if (raw && raw in PRICING) return raw as ModelId;
  if (raw) {
    console.warn(`[rung] tanınmayan RUNG_K1_MODEL "${raw}" — ${DEFAULT_MODEL} kullanılıyor`);
  }
  return DEFAULT_MODEL;
}

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
type Effort = (typeof EFFORTS)[number];

export function configuredEffort(): Effort {
  const raw = process.env.RUNG_K1_EFFORT;
  return EFFORTS.includes(raw as Effort) ? (raw as Effort) : "low";
}

export function costOf(
  model: ModelId,
  inputTokens: number,
  outputTokens: number
): number {
  const price = PRICING[model];
  return (
    (inputTokens / 1_000_000) * price.input +
    (outputTokens / 1_000_000) * price.output
  );
}

export class AnthropicProvider implements Provider {
  readonly id: ModelId;

  private readonly client: Anthropic;
  private readonly effort: Effort;

  constructor(apiKey?: string) {
    this.id = configuredModel();
    this.effort = configuredEffort();

    const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new ProviderError(
        "ANTHROPIC_API_KEY tanımlı değil. Yerelde .env.local'e, canlıda Vercel'in " +
          "Environment Variables paneline eklenmeli.",
        "no_key"
      );
    }
    this.client = new Anthropic({ apiKey: key });
  }

  async complete(request: ModelRequest): Promise<ModelResult> {
    const startedAt = Date.now();

    try {
      const response = await this.client.messages.parse({
        model: this.id,
        max_tokens: 16000,
        system: request.system,
        messages: [{ role: "user", content: request.user }],
        /*
         * Düşünme açık, çaba varsayılan olarak düşük. Bu iş uzun akıl yürütme
         * değil, sabit bir şemaya dikkatli çıkarım — ve çıktı token'ı girdinin
         * beş katı fiyatta, yani maliyeti asıl belirleyen şey düşünme uzunluğu.
         *
         * "Düşük çaba yeterli mi" sorusunun cevabı tahmin değil ölçüm:
         * Aşama 05'in eval'i aynı altın kümede low/medium/high koşturup
         * isabet ve yanlış alarmı karşılaştıracak. O zamana kadar ucuz olan
         * varsayılan, ve `RUNG_K1_EFFORT` ile tek satırda değişiyor.
         */
        thinking: { type: "adaptive" },
        output_config: {
          effort: this.effort,
          format: zodOutputFormat(request.schema),
        },
      });

      if (response.stop_reason === "refusal") {
        throw new ProviderError(
          `Model isteği reddetti: ${response.stop_details?.category ?? "sebep yok"}`,
          "bad_response"
        );
      }

      const parsed = response.parsed_output;
      if (!parsed) {
        throw new ProviderError(
          "Model şemaya uygun bir cevap üretmedi.",
          "bad_response"
        );
      }

      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;

      return {
        parsed,
        usage: {
          inputTokens,
          outputTokens,
          costUsd: costOf(this.id, inputTokens, outputTokens),
        },
        modelId: this.id,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;

      // En özelden en genele — hepsini tek `APIError`'a düşürmek, tekrar
      // denenebilir hatayla denenemez olanı ayırt edilemez hâle getirirdi.
      if (error instanceof Anthropic.RateLimitError) {
        throw new ProviderError("Hız sınırına takıldı.", "rate_limit", { cause: error });
      }
      if (error instanceof Anthropic.AuthenticationError) {
        throw new ProviderError("API anahtarı geçersiz.", "no_key", { cause: error });
      }
      if (error instanceof Anthropic.APIConnectionError) {
        throw new ProviderError("Modele ulaşılamadı.", "network", { cause: error });
      }
      if (error instanceof Anthropic.APIError) {
        throw new ProviderError(`Model hatası (${error.status}).`, "other", { cause: error });
      }

      throw new ProviderError("Beklenmeyen model hatası.", "other", { cause: error });
    }
  }
}

/*
 * Hangi sağlayıcı kullanılacak.
 *
 * Anahtar yoksa sahte sağlayıcıya DÜŞMÜYORUZ — sessizce sahte sonuç üretmek,
 * ölçümü olan bir üründe yapılabilecek en kötü şey. Anahtar yoksa analiz
 * çalışmıyor ve ekranda neden çalışmadığı yazıyor.
 */
export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
