/*
 * Vitrindeki iki cümle.
 *
 * Bileşende DEĞİL burada duruyorlar, çünkü `showcase.test.ts` bunları içeri
 * alıyor ve `node --test` bir `.tsx` dosyasını yükleyemiyor
 * (ERR_UNKNOWN_FILE_EXTENSION — tipleri soyuyor, JSX'i çevirmiyor).
 *
 * `clean` UYDURMA DEĞİL: gerçek K0 bu cümlede sıfır bulgu veriyor ve
 * yanındaki test bunu kilitliyor. Bir kural değişip motor doğru cümleye
 * takılırsa vitrin sessizce yalan söylemeye başlamıyor — `npm test` düşüyor.
 */
export const SHOWCASE_SAMPLES = {
  broken:
    "I am agree with your suggestion about the meeting of tomorrow. " +
    "Thanks for the informations you sent me, i recieved them yesterday.",
  clean:
    "I agree with your suggestion about tomorrow's meeting. " +
    "Thank you for the information you sent me; I received it yesterday.",
} as const;

export type ShowcaseVariant = keyof typeof SHOWCASE_SAMPLES;
