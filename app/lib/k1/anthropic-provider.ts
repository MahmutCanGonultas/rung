import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { RawResponseSchema } from "./contract.ts";
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

export const MODEL_ID = "claude-opus-5";

/*
 * Fiyatlar 1 milyon token başına, dolar. Maliyet hesabı buradan yapılıyor ve
 * her analiz koşumuyla birlikte veritabanına yazılıyor — doğruluk panosundaki
 * "kayıt başı maliyet" bu sayıdan geliyor.
 *
 * Fiyat değişirse burası güncellenir; geçmiş kayıtlar o günkü fiyatla
 * hesaplanmış hâlleriyle kalır, geriye dönük değişmez.
 */
const PRICE_PER_MTOK = { input: 5.0, output: 25.0 };

function costOf(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICE_PER_MTOK.input +
    (outputTokens / 1_000_000) * PRICE_PER_MTOK.output
  );
}

export class AnthropicProvider implements Provider {
  readonly id = MODEL_ID;

  private readonly client: Anthropic;

  constructor(apiKey?: string) {
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
        model: MODEL_ID,
        max_tokens: 16000,
        system: request.system,
        messages: [{ role: "user", content: request.user }],
        /*
         * Düşünme açık ama çaba düşük tutuluyor: bu iş uzun akıl yürütme
         * değil, sabit bir şemaya dikkatli çıkarım. Yüksek çaba maliyeti
         * ikiye katlarken bulgu kalitesini bu görevde belirgin artırmıyor —
         * gerçek sayılarla ölçüldüğünde (Aşama 05 eval) tekrar bakılacak.
         */
        thinking: { type: "adaptive" },
        output_config: {
          effort: "medium",
          format: zodOutputFormat(RawResponseSchema),
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
          costUsd: costOf(inputTokens, outputTokens),
        },
        modelId: MODEL_ID,
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
