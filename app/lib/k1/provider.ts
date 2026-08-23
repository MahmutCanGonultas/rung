import type { ZodType } from "zod";

/*
 * Sağlayıcı soyutlaması.
 *
 * Sistemin geri kalanı hangi modeli çağırdığımızı bilmiyor; sadece bu arayüzü
 * biliyor. Sağlayıcı değişirse tek dosya değişiyor.
 *
 * Ayrıca test edilebilirlik: `fake.ts` bu arayüzü sabit cevaplarla uyguluyor,
 * böylece saklama, doğrulama, ekran ve eval'in tamamı **API anahtarı olmadan**
 * uçtan uca çalıştırılabiliyor.
 */

export type ModelRequest = {
  system: string;
  user: string;
  /*
   * Beklenen çıktının şeması. Sağlayıcı bunu modele "yapılandırılmış çıktı"
   * olarak veriyor; model bunun dışına çıkamıyor.
   *
   * Zod tipi olarak duruyor çünkü iki farklı katman iki farklı şema
   * kullanıyor: K1 bulgu listesi, K2 karar listesi. Sağlayıcı hangisi
   * olduğunu bilmiyor — sadece şemayı geçiriyor.
   */
  schema: ZodType;
};

export type ModelUsage = {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type ModelResult = {
  /* Şemaya uyduğu doğrulanmış ham cevap. Anlamını çağıran taraf biliyor. */
  parsed: unknown;
  usage: ModelUsage;
  modelId: string;
  durationMs: number;
};

export interface Provider {
  readonly id: string;
  complete(request: ModelRequest): Promise<ModelResult>;
}

/** Sağlayıcının kendi hatası — çağıran tarafın yakalayıp kaydedeceği tip. */
export type ProviderErrorKind =
  | "no_key"
  | "rate_limit"
  | "bad_response"
  | "network"
  | "other";

export class ProviderError extends Error {
  // Parametre özelliği kısayolu yok — `erasableSyntaxOnly` altında yasak,
  // çünkü Node'un tip soyma modu onu çalıştıramıyor.
  readonly kind: ProviderErrorKind;

  constructor(
    message: string,
    kind: ProviderErrorKind,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "ProviderError";
    this.kind = kind;
  }
}
