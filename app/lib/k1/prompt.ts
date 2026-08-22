import { FAMILIES, SUBCATEGORIES } from "../taxonomy.ts";
import type { Level } from "../content-types.ts";

/*
 * İstem (prompt).
 *
 * Sürümlü: `PROMPT_VERSION` değişmeden istem değiştirilmez. Sebep plan §07 —
 * sürüm tutulmazsa iki ölçüm karşılaştırılamaz, "iyileşti" cümlesi kurulamaz.
 *
 * Tasarım ilkeleri:
 *  1. Model taksonominin dışına çıkamıyor — kodlar istemde listeli, şemada da
 *     enum olarak zorlanıyor.
 *  2. Model konum vermiyor; hatalı metni birebir kopyalıyor. Konumu biz
 *     buluyoruz — modeller karakter saymada güvenilmez.
 *  3. K0'ın zaten bulduğu şeyler modele "bulundu" diye veriliyor ki aynı
 *     hatayı ikinci kez raporlamasın; para ve gürültü tasarrufu.
 *  4. Yanlış alarm pahalı: emin değilse bulgu üretmemesi açıkça isteniyor.
 */

function taxonomyBlock(): string {
  const byFamily = new Map<string, string[]>();

  for (const [code, meta] of Object.entries(SUBCATEGORIES)) {
    const family = FAMILIES[meta.family];
    const list = byFamily.get(family) ?? [];
    list.push(`${code} (${meta.label})`);
    byFamily.set(family, list);
  }

  return [...byFamily.entries()]
    .map(([family, codes]) => `- ${family}: ${codes.join(", ")}`)
    .join("\n");
}

export const SYSTEM_PROMPT = `You analyse English written by native Turkish speakers and report errors.

You are one layer of a measurement instrument, not a tutor and not a chat
assistant. Your output is stored, counted and compared over months, so it must
be consistent above all else.

TAXONOMY — every finding must use exactly one of these subcategory codes:
${taxonomyBlock()}

RULES
1. Report only what is genuinely wrong. A false alarm — "correcting" something
   that was already correct — costs far more than a miss. When unsure, say
   nothing.
2. Copy the faulty span from the text VERBATIM into "original". Do not
   paraphrase it, do not fix it there, do not invent text that is not present.
3. Write "explanation" in TURKISH, one sentence, saying why it is wrong. When
   the error comes from Turkish interference, say which Turkish habit produced
   it — that is the most useful thing you can tell this reader.
4. Prefer the turkish family (article_drop, literal_translation, tr_word_order,
   tr_pattern) when the error is characteristic of Turkish speakers.
5. Style preferences are not errors. Only flag register when the text clearly
   breaks the register the task asked for.
6. Set "confidence" honestly. Below 0.6 means you would not defend it.`;

export type PromptInput = {
  text: string;
  level: Level;
  taskPrompt: string | null;
  taskHint: string | null;
  /** K0'ın bulduğu ve tekrar raporlanmaması gereken parçalar. */
  alreadyFound: string[];
};

export function buildUserMessage(input: PromptInput): string {
  const parts: string[] = [];

  parts.push(`LEARNER LEVEL: ${input.level}`);

  if (input.taskPrompt) {
    parts.push(`TASK THEY WERE GIVEN: ${input.taskPrompt}`);
  }
  if (input.taskHint) {
    parts.push(`TASK NOTE (in Turkish): ${input.taskHint}`);
  }

  if (input.alreadyFound.length > 0) {
    parts.push(
      "ALREADY REPORTED by the deterministic layer — do not report these again:\n" +
        input.alreadyFound.map((s) => `- ${s}`).join("\n")
    );
  }

  parts.push(
    `LEVEL GUIDANCE: at A1 and A2, basic grammar matters most and nuance is ` +
      `noise. At B2 and C1, basic slips are distractions; register, collocation ` +
      `and naturalness matter. Weight your findings accordingly, but do not ` +
      `withhold a clear error because of level.`
  );

  parts.push(`TEXT:\n${input.text}`);

  return parts.join("\n\n");
}
