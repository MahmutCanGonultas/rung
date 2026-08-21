import { A1, A2, B1, B2, parse } from "./word-bands.ts";
import { words } from "./tokenize.ts";

/*
 * Kullanılan kelimeleri seviye bantlarına eşler.
 *
 * Plan §06: seviye tahmininin dört girdisinden biri "kullandığın kelimelerin
 * hangi bantlara düştüğü". Bu dosya o girdiyi üretiyor — model kullanmadan.
 */

export const BAND_ORDER = ["A1", "A2", "B1", "B2", "C1"] as const;
export type Band = (typeof BAND_ORDER)[number];

/*
 * Bantlar sırayla taranıyor ve **ilk eşleşme kazanıyor**. Bir kelime hem A1
 * hem A2 listesindeyse A1'dir: bir kelimenin seviyesi, onu öğrenmek için
 * gereken EN DÜŞÜK seviyedir.
 */
const TABLE: Array<{ band: Band; words: Set<string> }> = [
  { band: "A1", words: parse(A1) },
  { band: "A2", words: parse(A2) },
  { band: "B1", words: parse(B1) },
  { band: "B2", words: parse(B2) },
];

/*
 * Basit çekim soyma.
 *
 * Tam bir lemmatizer değil — o, sözlük ve dil bilgisi ister. Buradaki amaç
 * "works", "worked", "working" kelimelerinin "work" bandına düşmesi. Yanlış
 * soyduğunda kelime listede bulunamıyor ve C1 sayılıyor; yani hata yönü
 * "bilmiyorum" tarafına, "yanlış biliyorum" tarafına değil.
 */
function stems(word: string): string[] {
  const w = word.toLowerCase();
  const out = [w];

  const push = (s: string) => {
    if (s.length >= 2 && !out.includes(s)) out.push(s);
  };

  if (w.endsWith("ies")) push(`${w.slice(0, -3)}y`);
  if (w.endsWith("es")) push(w.slice(0, -2));
  if (w.endsWith("s") && !w.endsWith("ss")) push(w.slice(0, -1));

  if (w.endsWith("ied")) push(`${w.slice(0, -3)}y`);
  if (w.endsWith("ed")) {
    push(w.slice(0, -2));
    push(w.slice(0, -1)); // "liked" → "like"
    // "stopped" → "stop": ikizlenen ünsüzü tek yap
    const base = w.slice(0, -2);
    if (base.length >= 3 && base[base.length - 1] === base[base.length - 2]) {
      push(base.slice(0, -1));
    }
  }

  if (w.endsWith("ing")) {
    const base = w.slice(0, -3);
    push(base);
    push(`${base}e`); // "writing" → "write"
    if (base.length >= 3 && base[base.length - 1] === base[base.length - 2]) {
      push(base.slice(0, -1)); // "running" → "run"
    }
  }

  if (w.endsWith("ly")) push(w.slice(0, -2));
  if (w.endsWith("ily")) push(`${w.slice(0, -3)}y`);
  if (w.endsWith("est")) push(w.slice(0, -3));
  if (w.endsWith("er")) {
    push(w.slice(0, -2));
    push(w.slice(0, -1));
  }

  return out;
}

/** Bir kelimenin bandı. Hiçbir listede yoksa C1 — "bu seviyenin üstü ya da nadir". */
export function bandOf(word: string): Band {
  const candidates = stems(word);

  for (const entry of TABLE) {
    for (const candidate of candidates) {
      if (entry.words.has(candidate)) return entry.band;
    }
  }

  return "C1";
}

export type BandProfile = {
  /** Her banttaki FARKLI kelime sayısı. */
  counts: Record<Band, number>;
  /** Her bandın toplam farklı kelimeye oranı. */
  shares: Record<Band, number>;
  distinctWords: number;
  /** A1+A2 dışında kalanların payı — "temel kelime dağarcığının ötesi". */
  aboveBasic: number;
};

/*
 * `ignore`: bant dışı bırakılacak kelimeler (küçük harfli).
 *
 * Yanlış yazılmış kelimeler hiçbir listede olmadığı için C1 sayılıyordu —
 * yani "recieved" yazan biri, kelime dağarcığı ileri seviyeymiş gibi
 * görünüyordu. Yazım hatası bir kelime bilgisi göstergesi değil; ölçümden
 * çıkarılıyor.
 */
export function profile(text: string, ignore: Set<string> = new Set()): BandProfile {
  const distinct = new Set(
    words(text)
      .map((w) => w.text.toLowerCase())
      .filter((w) => !ignore.has(w))
  );

  const counts: Record<Band, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
  for (const word of distinct) counts[bandOf(word)] += 1;

  const total = distinct.size;
  const shares = {} as Record<Band, number>;
  for (const band of BAND_ORDER) {
    shares[band] = total === 0 ? 0 : counts[band] / total;
  }

  return {
    counts,
    shares,
    distinctWords: total,
    aboveBasic: total === 0 ? 0 : (counts.B1 + counts.B2 + counts.C1) / total,
  };
}
