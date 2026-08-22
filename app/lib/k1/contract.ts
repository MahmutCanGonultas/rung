import { z } from "zod";

import { SUBCATEGORIES, type Finding, type Subcategory } from "../taxonomy.ts";

/*
 * Modelle aramızdaki sözleşme.
 *
 * Plan §07 ikinci savunma: "Modele açık uçlu soru sorulmaz. Sabit kategori,
 * zorunlu şema." Bu dosya o şemayı ve şemaya uymayan cevabın nasıl
 * reddedileceğini tanımlıyor.
 *
 * Burada model çağrısı YOK — sadece istek nasıl kurulur, cevap nasıl
 * doğrulanır. Sağlayıcıdan bağımsız olması bilinçli: sağlayıcı değişse de
 * bu dosya aynı kalır.
 */

export const PROMPT_VERSION = "v1";

/** Modelin döndürmesi gereken tek bir bulgunun ham hâli. */
export type RawFinding = {
  subcategory: string;
  original: string;
  suggestion: string | null;
  explanation: string;
  confidence: number;
};

export type RawResponse = {
  findings: RawFinding[];
};

/*
 * Modele verilen JSON şeması. Sağlayıcının "yapılandırılmış çıktı" ya da
 * "araç kullanımı" mekanizmasına bu şema veriliyor; model bunun dışına
 * çıkamıyor.
 *
 * Konum (start/end) modelden İSTENMİYOR. Sebep: modeller karakter sayarken
 * güvenilmez, ve yanlış konum bulguyu metnin başka bir yerine çapalar.
 * Onun yerine model hatalı METNİ veriyor, konumu biz metinde arayarak
 * buluyoruz — deterministik ve doğrulanabilir.
 */
const SUBCATEGORY_CODES = Object.keys(SUBCATEGORIES) as [Subcategory, ...Subcategory[]];

/*
 * Zod şeması — sağlayıcıya verilen "yapılandırılmış çıktı" biçimi bundan
 * üretiliyor. Tek kaynak: taksonomiye yeni bir kod eklenince burası
 * kendiliğinden güncelleniyor, elle senkron tutulacak ikinci bir liste yok.
 */
export const RawFindingSchema = z.object({
  subcategory: z.enum(SUBCATEGORY_CODES),
  original: z.string(),
  suggestion: z.string().nullable(),
  explanation: z.string(),
  confidence: z.number().min(0).max(1),
});

export const RawResponseSchema = z.object({
  findings: z.array(RawFindingSchema).max(20),
});

export function responseSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["findings"],
    properties: {
      findings: {
        type: "array",
        maxItems: 20,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["subcategory", "original", "suggestion", "explanation", "confidence"],
          properties: {
            subcategory: {
              type: "string",
              enum: Object.keys(SUBCATEGORIES),
              description: "Sabit taksonomiden bir alt kategori kodu.",
            },
            original: {
              type: "string",
              description:
                "Metinden BİREBİR kopyalanmış hatalı parça. Metinde geçmeyen bir şey yazma.",
            },
            suggestion: {
              type: ["string", "null"],
              description: "Önerilen düzeltme. Öneri yoksa null.",
            },
            explanation: {
              type: "string",
              description:
                "TÜRKÇE, tek cümle, neden hatalı olduğunu anlatan açıklama.",
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Bunun gerçekten hata olduğuna dair güven.",
            },
          },
        },
      },
    },
  } as const;
}

export type ValidationIssue = {
  index: number;
  reason: string;
};

export type ValidationResult = {
  findings: Finding[];
  /** Elenen bulgular ve eleme gerekçeleri — eval için değerli. */
  rejected: ValidationIssue[];
};

function isSubcategory(value: string): value is Subcategory {
  return Object.hasOwn(SUBCATEGORIES, value);
}

/*
 * Modelin cevabını metne karşı doğrular.
 *
 * Şema zorlaması "biçim" garantisi veriyor, "doğruluk" garantisi vermiyor.
 * Model şemaya uygun ama metinde geçmeyen bir parça uydurabilir. Burada her
 * bulgu metinde ARANIYOR; bulunamayan eleniyor.
 *
 * Bu, uydurmaya (hallucination) karşı en ucuz ve en kesin savunma: konumu
 * doğrulanamayan bulgu kullanıcıya hiç gösterilmiyor.
 */
export function validate(text: string, raw: RawResponse): ValidationResult {
  const findings: Finding[] = [];
  const rejected: ValidationIssue[] = [];
  const lower = text.toLowerCase();

  raw.findings.forEach((item, index) => {
    if (!isSubcategory(item.subcategory)) {
      rejected.push({ index, reason: `taksonomide olmayan kod: ${item.subcategory}` });
      return;
    }

    if (typeof item.original !== "string" || item.original.trim().length === 0) {
      rejected.push({ index, reason: "boş original" });
      return;
    }

    // Önce birebir, sonra büyük/küçük harf duyarsız ara.
    let start = text.indexOf(item.original);
    if (start === -1) start = lower.indexOf(item.original.toLowerCase());
    if (start === -1) {
      rejected.push({
        index,
        reason: `metinde geçmiyor: "${item.original.slice(0, 40)}"`,
      });
      return;
    }

    if (typeof item.explanation !== "string" || item.explanation.trim().length < 5) {
      rejected.push({ index, reason: "açıklama yok ya da çok kısa" });
      return;
    }

    const confidence = Number(item.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      rejected.push({ index, reason: `geçersiz güven: ${item.confidence}` });
      return;
    }

    findings.push({
      subcategory: item.subcategory,
      start,
      end: start + item.original.length,
      original: text.slice(start, start + item.original.length),
      suggestion:
        typeof item.suggestion === "string" && item.suggestion.length > 0
          ? item.suggestion
          : null,
      explanation: item.explanation.trim(),
      confidence,
      layer: "K1",
    });
  });

  return { findings, rejected };
}
