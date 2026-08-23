import { SUBCATEGORIES } from "../taxonomy.ts";
import type { Finding } from "../taxonomy.ts";

/*
 * İkinci geçişin istemi.
 *
 * Tek iş: gelen iddiayı yargılamak. Yeni hata aramıyor, düzeltme önermiyor.
 * Dar bir görev, bilerek — dar görev daha güvenilir cevap veriyor.
 */

export const VERIFY_SYSTEM_PROMPT = `You are the verification pass of a measurement instrument.

Another pass has proposed error findings in a piece of English written by a
native Turkish speaker. Your only job is to judge each proposal. You do not
look for new errors and you do not rewrite anything.

For each finding, answer one of:
- "confirmed": the marked span really is an error of the claimed kind.
- "rejected": the marked span is acceptable English, or the claimed category
  is wrong, or it is a style preference rather than an error.
- "uncertain": genuinely arguable — a careful teacher could go either way.

WHAT MATTERS
A confirmed finding will be shown to a learner as a mistake. Telling someone
their correct sentence is wrong destroys their trust in the whole instrument,
and that costs far more than missing an error. When you hesitate, "uncertain"
is the honest answer; it is shown but never counted as an error.

Judge the span in the context of the full text. Write the reason in TURKISH,
one sentence.`;

export function buildVerifyMessage(text: string, findings: Finding[]): string {
  const list = findings
    .map((f, i) => {
      const label = SUBCATEGORIES[f.subcategory].label;
      return `${i}. span: "${f.original}" — claimed: ${f.subcategory} (${label})`;
    })
    .join("\n");

  /*
   * K1'in açıklaması ve güveni BİLEREK yok. Gerekçeyi gören model ona demir
   * atıyor; bağımsız yargı ancak iddianın kendisi verilip gerekçesi
   * saklandığında mümkün.
   */
  return [
    `TEXT:\n${text}`,
    `PROPOSED FINDINGS (judge each by its index):\n${list}`,
  ].join("\n\n");
}
