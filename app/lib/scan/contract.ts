import { z } from "zod";

/*
 * DEFTERDEN EKRANA — fotoğraftan metin.
 *
 * Bu katman ölçüm zincirinin (K0…K4) parçası DEĞİL, GİRDİSİ. Ölçüm metni
 * okuyor; burada yapılan iş metni kâğıttan alıp ölçülebilir hâle getirmek.
 * Ayrı klasörde durmasının sebebi bu: K1 ve K2 bir ölçüm katmanı, bu bir
 * yazma yolu.
 *
 * TEK KURAL, GERİ KALAN HER ŞEYDEN ÖNEMLİ: MODEL DÜZELTMEZ.
 *
 * Kâğıtta "I am agree" yazıyorsa ekrana "I am agree" gelir. Model yazımı
 * düzeltirse ölçüm kişinin değil MODELİN seviyesini ölçmüş olur — ve bu,
 * ürünün varlık sebebini ortadan kaldırır. Şema da, istem de bu tek cümlenin
 * etrafında kurulu.
 */

export const PROMPT_VERSION = "v1";

export const ScanSchema = z.object({
  /** Sayfadaki metin, HATALARIYLA BİRLİKTE. Okunaklı bir şey yoksa boş. */
  text: z.string(),
  /*
   * Okunamayan ya da tahmine dayanan kelimeler.
   *
   * Metnin İÇİNE `[?]` gibi bir işaret KOYULMUYOR: o işaret ölçüm katmanına
   * bir yazım hatası olarak girer ve kişiye olmayan bir hata gösterilirdi —
   * ürünün en sert kuralı tam olarak bunu yasaklıyor. Şüpheli kelimeler ayrı
   * listede geliyor, ekran onları "şunları kontrol et" diye gösteriyor.
   */
  uncertain: z.array(z.string()),
  /** Fotoğrafta okunabilir bir metin var mı. Yoksa `text` boş. */
  legible: z.boolean(),
});

export type ScanResult = z.infer<typeof ScanSchema>;

/*
 * Kabul edilen görsel türleri.
 *
 * `run.ts`te DEĞİL burada: o dosya `server-only` işaretli ve onu import eden
 * her şey `node --test` altında patlıyor. Bu liste ise saf veri ve tam olarak
 * sınanması gereken yer — gelen tür sunucuda süzülmezse doğrudan modele
 * gidiyor.
 */
export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type ImageType = (typeof IMAGE_TYPES)[number];

export function isImageType(value: string): value is ImageType {
  return (IMAGE_TYPES as readonly string[]).includes(value);
}

export const SYSTEM_PROMPT = `You transcribe photographs of handwritten or printed pages into plain text.

You are the input stage of a measurement instrument. The text you produce is
measured for language errors, and that measurement is stored and compared over
months. This gives you one rule that outranks every other instinct you have:

TRANSCRIBE. DO NOT CORRECT.

If the page reads "I am agree with you", you write "I am agree with you". If a
word is misspelled, copy the misspelling letter for letter. If a sentence
starts without a capital, it stays without one. If a comma is missing, it stays
missing. Silently fixing anything would show the writer a level that belongs to
you rather than to them, which is the one failure this product cannot survive.

RULES
1. Reproduce the text exactly as written, errors included.
2. Line breaks on paper are where the page ran out, not where the writer
   ended a thought. Join the lines of a paragraph into continuous text with
   single spaces. Keep a real paragraph break (blank line or clear
   indentation) as a blank line.
3. Never put placeholders such as [?] or [illegible] into "text". For a word
   you cannot read with confidence, write your best single reading in the text
   and add that same word to "uncertain". A placeholder would be measured as a
   spelling error the writer never made.
4. Add nothing that is not on the page: no title, no heading, no commentary,
   no finishing of a half-written sentence.
5. Crossed-out or struck-through words were deleted by the writer — leave them
   out. Words squeezed in above a line or marked with a caret were added by
   the writer — put them where they belong.
6. Do not translate. Whatever language the page is in, transcribe it in that
   language.
7. If the photograph shows no readable text at all — a blank page, a blurred
   shot, an object — set "legible" to false and leave "text" empty.

Return only the structured object.`;

/** Modele giden kullanıcı mesajının metin kısmı. */
export const USER_PROMPT =
  "Transcribe this page. Copy every error exactly as written.";
