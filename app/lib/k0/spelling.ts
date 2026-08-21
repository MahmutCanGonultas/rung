import nspell from "nspell";
import dictionaryEn from "dictionary-en";

import { sentences, words, type Word } from "./tokenize.ts";

/*
 * Yazım denetimi.
 *
 * Araç seçimi tercihle değil ölçümle yapıldı — `scripts/bench/spell-bench.mjs`
 * iki adayı 40 hatalı + 40 doğru kelimelik altın kümede karşılaştırıyor:
 *
 *   nspell + dictionary-en   isabet %100 · yakalama %100 · yanlış alarm  %0
 *   sistem kelime listesi    isabet  %62 · yakalama  %95 · yanlış alarm %57.5
 *
 * Naif liste çekimli hâlleri ("receives", "occurring") ve modern kelimeleri
 * ("email", "website") bilmiyor; her birine "hata" diyor. Plan §07: ana ölçüt
 * yakalama değil yanlış alarm. Karar bu satıra dayanıyor.
 */

/*
 * Sözlük ~1 MB. Modül seviyesinde bir kez kuruluyor, her istekte değil.
 * `dictionary-en` içeriği paketin içinde geliyor, ağdan bir şey inmiyor.
 *
 * Bu dosyada `server-only` işareti YOK — birim testleri onu düz Node altında
 * import ediyor ve `server-only` orada hata fırlatıyor. Tarayıcıya sızma
 * riskine karşı ikinci bir kilit var: modül Node'un `Buffer`'ını kullanıyor,
 * istemci paketine girerse derleme zaten kırılır.
 */
let speller: ReturnType<typeof nspell> | null = null;

function getSpeller() {
  if (speller) return speller;

  /*
   * `dictionary-en` sözlüğü `Uint8Array` olarak veriyor, `nspell` tipleri
   * `Buffer` bekliyor. Çalışma anında sorun yok — Buffer zaten bir
   * Uint8Array — ama tip uyuşmuyor. Kopyalamadan aynı belleğe Buffer görünümü
   * açıyoruz: `as any` ile tipi susturmak yerine gerçekten doğru tipi veriyoruz.
   */
  const view = (data: Uint8Array) =>
    Buffer.from(data.buffer, data.byteOffset, data.byteLength);

  speller = nspell({
    aff: view(dictionaryEn.aff),
    dic: view(dictionaryEn.dic),
  });
  return speller;
}

export type Misspelling = {
  word: string;
  start: number;
  end: number;
  /** Sözlüğün önerdiği ilk birkaç düzeltme. */
  suggestions: string[];
};

/*
 * Özel isimler sözlükte yok ve olması da beklenmez: "Mahmut", "Kadıköy",
 * "Vercel". Hepsine "yazım hatası" demek, yanlış alarm oranını tek başına
 * uçurur. Ayrım için basit ve deterministik bir kural: cümle başında
 * OLMAYAN büyük harfli kelime özel isim sayılır ve atlanır.
 *
 * Bedeli bilerek kabul edildi: cümle ortasında büyük harfle yazılmış gerçek
 * bir yazım hatası kaçar. Kaçırmak, doğru yazılmış bir ismi kırmızıya
 * boyamaktan ucuz.
 */
function isLikelyProperNoun(word: Word, sentenceStarts: Set<number>): boolean {
  const first = word.text[0];
  if (!first || first !== first.toUpperCase() || !/[A-Za-z]/.test(first)) {
    return false;
  }
  return !sentenceStarts.has(word.start);
}

/** Kısaltmalar: NASA, PDF, API. Sözlükte yoklar, hata da değiller. */
function isAcronym(text: string): boolean {
  return text.length >= 2 && text.length <= 6 && text === text.toUpperCase();
}

export function findMisspellings(text: string): Misspelling[] {
  const spell = getSpeller();
  const sentenceStarts = new Set(sentences(text).map((s) => s.start));
  const found: Misspelling[] = [];

  for (const word of words(text)) {
    if (isAcronym(word.text)) continue;
    if (isLikelyProperNoun(word, sentenceStarts)) continue;

    // Sözlük büyük harfe duyarlı: "english" hatalı, "English" değil.
    // Cümle başındaki büyük harf yapay olduğu için küçüğünü de deniyoruz.
    if (spell.correct(word.text)) continue;
    if (spell.correct(word.text.toLowerCase())) continue;

    found.push({
      word: word.text,
      start: word.start,
      end: word.end,
      suggestions: spell.suggest(word.text).slice(0, 3),
    });
  }

  return found;
}
