import { profile } from "../k0/bands.ts";
import { measure } from "../k0/metrics.ts";
import { LEVELS, type Level } from "../content-types.ts";

/*
 * Seviye tahmini.
 *
 * Plan §06: "Kullanıcıya sormak güvenilmez — insanlar kendi seviyesini yanlış
 * tahmin eder. Ölçüyoruz, ve tamamen K0 katmanının verisiyle."
 *
 * Dört girdi, plandaki sırayla:
 *   1. kelime seviyesi dağılımı
 *   2. cümle karmaşıklığı
 *   3. hata yoğunluğu
 *   4. hata TÜRÜ — "en belirleyicisi: temel gramer mi, nüans mı"
 *
 * Model yok. Aynı metin her zaman aynı tahmini veriyor.
 */

export type LevelSignal = {
  name: string;
  /** 0–4 arası sürekli değer: 0 = A1, 4 = C1. */
  value: number;
  band: Level;
  detail: string;
};

export type LevelEstimate = {
  level: Level;
  /** 0–4 arası ham skor — bant kayması bu sayının kaymasıdır. */
  score: number;
  signals: LevelSignal[];
  /** Kısa metinde tahmin oynak; ekranda uyarı gösterilmesi için. */
  reliable: boolean;
};

/** Sürekli skoru banda çevirir. Eşikler eşit aralıklı, bilerek sade. */
export function bandOfScore(score: number): Level {
  const index = Math.max(0, Math.min(LEVELS.length - 1, Math.round(score)));
  return LEVELS[index];
}

/*
 * Bir ölçümü 0–4 skoruna çeviren yardımcı.
 *
 * `stops` beş eşik: sırasıyla A1, A2, B1, B2, C1 için tipik değerler.
 * Aradaki değerler doğrusal olarak yorumlanıyor — eşik tablosunun kendisi
 * bir tahmin, ve gerçek kullanıcı verisi biriktikçe düzeltilecek.
 */
function interpolate(value: number, stops: [number, number, number, number, number]): number {
  if (value <= stops[0]) return 0;
  if (value >= stops[4]) return 4;

  for (let i = 0; i < 4; i++) {
    const low = stops[i];
    const high = stops[i + 1];
    if (value <= high) {
      return i + (value - low) / (high - low);
    }
  }

  return 4;
}

/*
 * Ağırlıklar. Plan §06 "hata türü en belirleyicisi" diyor, o yüzden en yüksek
 * ağırlık orada. Sayılar bir tahmin — gerçek veriyle ayarlanacak, ve o gün
 * geldiğinde değişecek tek yer burası.
 */
const WEIGHTS = {
  vocabulary: 0.25,
  complexity: 0.25,
  density: 0.2,
  errorKind: 0.3,
};

/* Temel gramer hataları — A1/A2'nin işi. */
const BASIC = new Set([
  "agreement", "plural", "capitalization", "spelling", "punctuation",
  "article", "tense",
]);

/* Nüans hataları — B2/C1'in işi. */
const NUANCE = new Set([
  "register", "collocation", "cohesion", "vagueness", "word_order",
  "wrong_word", "countability",
]);

export function estimateLevel(
  text: string,
  findingSubcategories: string[] = []
): LevelEstimate {
  const metrics = measure(text);
  const bands = profile(text);

  // 1 · Kelime seviyesi dağılımı — temel bandın üstündeki kelimelerin payı.
  const vocabValue = bands.aboveBasic;
  const vocabulary = interpolate(vocabValue, [0.05, 0.12, 0.22, 0.35, 0.5]);

  // 2 · Cümle karmaşıklığı — yan cümle oranı ve ortalama uzunluk birlikte.
  const complexityValue =
    metrics.subordinationRatio * 0.6 + (metrics.avgSentenceLength / 25) * 0.4;
  const complexity = interpolate(complexityValue, [0.1, 0.22, 0.38, 0.55, 0.75]);

  /*
   * 3 · Hata yoğunluğu — TERS yönlü: yoğunluk düştükçe seviye yükseliyor.
   * 100 kelimede 12 bulgu A1'e, 1 bulgu C1'e işaret ediyor.
   */
  const densityValue =
    metrics.wordCount === 0
      ? 0
      : (findingSubcategories.length / metrics.wordCount) * 100;
  const density = 4 - interpolate(densityValue, [1, 3, 6, 9, 13]);

  /*
   * 4 · Hata TÜRÜ — en belirleyici girdi.
   *
   * Temel gramer hataları baskınsa düşük seviye; hatalar nüans tarafındaysa
   * yüksek. Hiç hata yoksa bu sinyal karar veremiyor ve nötr kalıyor —
   * "hatasız" tek başına C1 demek değil, A1 de kısa ve doğru cümle kurabilir.
   */
  const basic = findingSubcategories.filter((s) => BASIC.has(s)).length;
  const nuance = findingSubcategories.filter((s) => NUANCE.has(s)).length;
  const decided = basic + nuance;
  const errorKind =
    decided === 0 ? 2 : interpolate(nuance / decided, [0, 0.2, 0.45, 0.7, 0.9]);

  const score =
    vocabulary * WEIGHTS.vocabulary +
    complexity * WEIGHTS.complexity +
    density * WEIGHTS.density +
    errorKind * WEIGHTS.errorKind;

  const signals: LevelSignal[] = [
    {
      name: "Kelime bandı",
      value: vocabulary,
      band: bandOfScore(vocabulary),
      detail: `Farklı kelimelerin %${Math.round(vocabValue * 100)}'i temel bandın dışında`,
    },
    {
      name: "Cümle karmaşıklığı",
      value: complexity,
      band: bandOfScore(complexity),
      detail: `Yan cümle ${metrics.subordinationRatio.toFixed(2)} · ortalama ${metrics.avgSentenceLength.toFixed(1)} kelime`,
    },
    {
      name: "Hata yoğunluğu",
      value: density,
      band: bandOfScore(density),
      detail: `100 kelimede ${densityValue.toFixed(1)} bulgu`,
    },
    {
      name: "Hata türü",
      value: errorKind,
      band: bandOfScore(errorKind),
      detail:
        decided === 0
          ? "Sınıflanabilir hata yok — bu sinyal karar vermiyor"
          : `${basic} temel · ${nuance} nüans`,
    },
  ];

  return {
    level: bandOfScore(score),
    score,
    signals,
    reliable: metrics.reliable,
  };
}
