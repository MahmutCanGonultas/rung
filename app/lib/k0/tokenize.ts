/*
 * Metni cümlelere ve kelimelere ayırma.
 *
 * Göründüğü kadar kolay değil. Nokta her zaman cümle bitirmiyor:
 * "Dr. Smith", "e.g.", "U.S.", "3.5" — hepsinde nokta var, hiçbiri cümle
 * sonu değil. Kısaltma listesi olmadan "Mr. Brown arrived." iki cümle sayılır
 * ve ortalama cümle uzunluğu, dolayısıyla seviye tahmini bozulur.
 *
 * Bu dosya `server-only` DEĞİL: kelime sayacı gibi ölçümler ileride tarayıcıda
 * da gösterilebilsin diye saf tutuldu. İçinde veritabanı, gizli anahtar yok.
 */

/*
 * Kısaltmalar iki gruba ayrılıyor, çünkü ikisi farklı davranıyor.
 *
 * Unvanlar ("Dr.", "Mr.") neredeyse her zaman büyük harfle başlayan bir isim
 * tarafından takip edilir — "Dr. Smith". Yani sonrasında büyük harf görmek
 * cümle bittiğine dair kanıt DEĞİL.
 *
 * Diğerleri ("etc.", "e.g.") ise cümle sonunda da durabilir:
 * "apples, pears, etc. Then leave." Burada büyük harf gerçekten yeni cümle.
 *
 * Bu ayrımı yapmayan bir bölücü ya "Dr. Smith"i ikiye böler ya "etc."ten
 * sonrasını yutar. İkisi de ortalama cümle uzunluğunu, dolayısıyla seviye
 * tahminini bozar.
 */
const TITLE_ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "mt", "rev",
  // Tek harfler: "J. R. R. Tolkien" gibi baş harfler.
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
]);

const OTHER_ABBREVIATIONS = new Set([
  "vs", "etc", "eg", "ie", "cf", "al", "approx",
  "inc", "ltd", "co", "corp", "dept", "est", "dept",
  "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
  "mon", "tue", "wed", "thu", "fri", "sat", "sun",
]);

export type Sentence = {
  text: string;
  /** Metnin içindeki başlangıç konumu — bulgular buraya çapalanacak. */
  start: number;
  end: number;
};

export type Word = {
  text: string;
  start: number;
  end: number;
};

/**
 * Kelimeleri konumlarıyla birlikte çıkarır.
 *
 * Kesme işareti kelimenin parçası: "don't" ve "student's" tek kelime.
 * Tire de öyle: "state-of-the-art" tek kelime — `countWords` ile aynı kural.
 * Sayılar kelime sayılmıyor: "2026" yazmak kelime dağarcığı göstermiyor.
 */
export function words(text: string): Word[] {
  const found: Word[] = [];
  const pattern = /[A-Za-z]+(?:['’\-][A-Za-z]+)*/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    found.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return found;
}

/** Sonu `.` olan bir belirtecin gerçekten cümle bitirip bitirmediği. */
function endsSentence(text: string, dotIndex: number): boolean {
  const mark = text[dotIndex];

  // ! ve ? kısaltmalarda geçmiyor, doğrudan bitiriyor.
  if (mark === "!" || mark === "?") return true;

  // "3.5" gibi sayılarda noktanın iki yanı rakam.
  const before = text[dotIndex - 1];
  const after = text[dotIndex + 1];
  if (before && after && /\d/.test(before) && /\d/.test(after)) return false;

  // Noktadan hemen önceki kelimeyi al: kısaltma mı?
  let i = dotIndex - 1;
  while (i >= 0 && /[A-Za-z]/.test(text[i])) i--;
  const token = text.slice(i + 1, dotIndex).toLowerCase();

  if (token.length === 0) return true;

  // Unvan: sonrasında büyük harf beklenen normal durum, cümle bitmiyor.
  if (TITLE_ABBREVIATIONS.has(token)) return false;

  if (OTHER_ABBREVIATIONS.has(token)) {
    /*
     * Cümle bitiyor mu bitmiyor mu, sonrasına bakarak karar veriyoruz:
     * küçük harf devam ediyorsa cümlenin içindeyiz ("e.g. apples"),
     * büyük harf geliyorsa yeni cümle başlamış ("etc. Then leave").
     */
    let j = dotIndex + 1;
    while (j < text.length && /\s/.test(text[j])) j++;
    const next = text[j];
    if (!next) return true;
    return next === next.toUpperCase() && /[A-Za-z]/.test(next);
  }

  return true;
}

/**
 * Cümlelere ayırır.
 *
 * Kural: `.`, `!`, `?` işaretinden sonra boşluk gelirse ve işaret gerçekten
 * cümle bitiriyorsa, orada kes. Sondaki noktalama cümlenin içinde kalır.
 */
export function sentences(text: string): Sentence[] {
  const found: Sentence[] = [];
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== "." && ch !== "!" && ch !== "?") continue;
    if (!endsSentence(text, i)) continue;

    // Arka arkaya gelen noktalamayı tek sayı: "Really?!" tek cümle.
    let end = i + 1;
    while (end < text.length && /[.!?"'’”)]/.test(text[end])) end++;

    // Sondaysa ya da ardından boşluk geliyorsa cümle burada bitiyor.
    if (end >= text.length || /\s/.test(text[end])) {
      const slice = text.slice(start, end).trim();
      if (slice.length > 0) {
        const offset = text.slice(start, end).indexOf(slice[0]);
        found.push({ text: slice, start: start + offset, end });
      }
      start = end;
      i = end - 1;
    }
  }

  // Noktalamayla bitmeyen son parça da bir cümle.
  const tail = text.slice(start).trim();
  if (tail.length > 0) {
    const offset = text.slice(start).indexOf(tail[0]);
    found.push({ text: tail, start: start + offset, end: text.length });
  }

  return found;
}
