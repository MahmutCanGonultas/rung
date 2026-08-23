import { z } from "zod";

/*
 * İkinci geçişin sözleşmesi.
 *
 * Plan §07 dördüncü savunma: "Her bulguya bağımsız olarak 'bu gerçekten hata
 * mı?' sorulur. Maliyeti artırır, yanlış alarmı ciddi düşürür."
 *
 * BAĞIMSIZLIK burada ucuz bir kelime değil, tasarım kararı: ikinci geçişe
 * K1'in AÇIKLAMASI ve GÜVENİ verilmiyor. Sadece metin, hatalı parça ve iddia
 * edilen kategori gidiyor. Gerekçeyi görürse model ona demir atar
 * (anchoring) ve "doğrulama" bir onaylama törenine döner.
 */

export const VERDICT_VALUES = ["confirmed", "rejected", "uncertain"] as const;
export type Verdict = (typeof VERDICT_VALUES)[number];

export const RawVerdictSchema = z.object({
  index: z.number().int().min(0).describe("Kaçıncı bulgu — listedeki sıra."),
  verdict: z.enum(VERDICT_VALUES),
  reason: z.string().describe("TÜRKÇE, tek cümle gerekçe."),
});

export const VerdictResponseSchema = z.object({
  verdicts: z.array(RawVerdictSchema).max(20),
});

export type RawVerdictResponse = z.infer<typeof VerdictResponseSchema>;

export const VERIFY_PROMPT_VERSION = "verify-v1";

export type VerdictDecision = {
  index: number;
  verdict: Verdict;
  reason: string;
};

/*
 * Cevabı doğrular.
 *
 * Karar verilmeyen bulgu `uncertain` sayılıyor — sessizce `confirmed`
 * varsayılmıyor. Eksik cevap, onay değil.
 */
export function validateVerdicts(
  findingCount: number,
  raw: RawVerdictResponse
): VerdictDecision[] {
  const byIndex = new Map<number, VerdictDecision>();

  for (const item of raw.verdicts) {
    if (item.index < 0 || item.index >= findingCount) continue;
    if (byIndex.has(item.index)) continue; // ilk cevap geçerli
    byIndex.set(item.index, {
      index: item.index,
      verdict: item.verdict,
      reason: item.reason.trim(),
    });
  }

  return Array.from({ length: findingCount }, (_, index) => {
    const found = byIndex.get(index);
    if (found) return found;
    return {
      index,
      verdict: "uncertain" as const,
      reason: "İkinci geçiş bu bulgu için karar döndürmedi.",
    };
  });
}
