import type { RawResponse } from "./contract.ts";
import type { ModelRequest, ModelResult, Provider } from "./provider.ts";

/*
 * Sahte sağlayıcı.
 *
 * Gerçek modelin yerine geçen, deterministik bir taklit. Var olma sebebi tek:
 * API anahtarı olmadan da saklama, doğrulama, ekran ve ölçüm hattının tamamı
 * çalıştırılabilsin ve test edilebilsin.
 *
 * Ne yapıyor: metinde birkaç sabit kalıp arıyor ve bulduklarını modelin
 * döndüreceği biçimde veriyor. Bilerek KUSURLU — metinde geçmeyen bir bulgu
 * da üretebiliyor, çünkü doğrulama katmanının uydurmayı gerçekten elediğini
 * görmek istiyoruz.
 */

type Pattern = {
  match: RegExp;
  subcategory: string;
  suggestion: (m: RegExpMatchArray) => string;
  explanation: string;
  confidence: number;
};

const PATTERNS: Pattern[] = [
  {
    match: /\bI\s+am\s+boring\b/i,
    subcategory: "wrong_word",
    suggestion: () => "I am bored",
    explanation:
      '"boring" sıkıcı olan şeyi anlatır, sıkılan kişiyi değil — doğrusu "bored".',
    confidence: 0.93,
  },
  {
    match: /\bin\s+the\s+last\s+years\b/i,
    subcategory: "preposition",
    suggestion: () => "in recent years",
    explanation:
      '"son yıllarda" birebir çevrilmiş; İngilizcede "in recent years" doğal olan.',
    confidence: 0.81,
  },
  {
    match: /\bvery\s+much\s+([a-z]+)\b/i,
    subcategory: "register",
    suggestion: (m) => `much ${m[1]}`,
    explanation:
      '"very much" sıfattan önce gelmez; resmî metinde fazla vurgulu duruyor.',
    confidence: 0.62,
  },
];

export type FakeOptions = {
  /** Metinde geçmeyen uydurma bir bulgu ekle — doğrulamayı sınamak için. */
  hallucinate?: boolean;
  /** Taksonomide olmayan bir kod üret — şema doğrulamasını sınamak için. */
  invalidSubcategory?: boolean;
};

export class FakeProvider implements Provider {
  readonly id = "fake-model-v1";

  /*
   * Alan açıkça yazılıyor, `constructor(private readonly options)` kısayolu
   * kullanılmıyor: Node'un tip soyma modu "parametre özelliği" sözdizimini
   * desteklemiyor ve birim testleri bu dosyayı doğrudan Node ile çalıştırıyor.
   * `tsconfig.json`'daki `erasableSyntaxOnly` bunu derleme anında yakalıyor.
   */
  private readonly options: FakeOptions;

  constructor(options: FakeOptions = {}) {
    this.options = options;
  }

  async complete(request: ModelRequest): Promise<ModelResult> {
    // İstemin sonundaki "TEXT:" bloğu analiz edilecek metin.
    const marker = "TEXT:\n";
    const at = request.user.lastIndexOf(marker);
    const text = at === -1 ? "" : request.user.slice(at + marker.length);

    const findings: RawResponse["findings"] = [];

    for (const pattern of PATTERNS) {
      const m = text.match(pattern.match);
      if (!m) continue;
      findings.push({
        subcategory: pattern.subcategory,
        original: m[0],
        suggestion: pattern.suggestion(m),
        explanation: pattern.explanation,
        confidence: pattern.confidence,
      });
    }

    if (this.options.hallucinate) {
      findings.push({
        subcategory: "collocation",
        original: "this phrase is definitely not in the text",
        suggestion: "something else",
        explanation: "Uydurma bulgu — doğrulama katmanı bunu elemeli.",
        confidence: 0.9,
      });
    }

    if (this.options.invalidSubcategory) {
      findings.push({
        subcategory: "not_a_real_category",
        original: text.slice(0, 10),
        suggestion: null,
        explanation: "Taksonomide olmayan kod — elenmeli.",
        confidence: 0.9,
      });
    }

    return {
      parsed: { findings },
      usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
      modelId: this.id,
      durationMs: 0,
    };
  }
}
