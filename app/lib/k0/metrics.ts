import { sentences, words, type Word } from "./tokenize.ts";

/*
 * Ölçümler. Hiçbiri model kullanmıyor: aynı metin her zaman aynı sayıyı verir,
 * bedava ve anlık. Plan §04'ün K0 katmanı.
 */

export type Metrics = {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  longestSentence: number;
  /** Farklı kelime / toplam kelime. Uzunluğa duyarlı — aşağıdaki nota bak. */
  typeTokenRatio: number;
  /** Uzunluktan arındırılmış çeşitlilik. Kısa metinde `null`. */
  movingAverageTTR: number | null;
  /** Cümle başına yan cümle işaretçisi. */
  subordinationRatio: number;
  /** Ölçümün ne kadar güvenilir olduğu — kısa metinde sayılar oynak. */
  reliable: boolean;
};

/*
 * Yan cümle işaretçileri.
 *
 * "that" bilerek listede YOK. İki ayrı işi var — "the book that I read"
 * (yan cümle) ve "I know that" (işaret zamiri) — ve ikisini ayırmak dil
 * bilgisi çözümlemesi ister. Modelsiz ayıramadığımız için hiç saymıyoruz:
 * eksik saymak, yanlış saymaktan iyi. Aynı ilke plan §07'de de var —
 * kaçırmak, yanlış alarmdan ucuz.
 */
const SUBORDINATORS = new Set([
  "although", "though", "because", "since", "unless", "until", "while",
  "whereas", "whenever", "wherever", "if", "when", "after", "before",
  "who", "whom", "whose", "which", "where", "why", "whether",
]);

/** Kısa metinde oranlar oynak; bu sınırın altında "güvenilir" demiyoruz. */
const RELIABLE_MIN_WORDS = 40;

/** MATTR penceresi. Metin bundan kısaysa hesaplanmıyor. */
const MATTR_WINDOW = 40;

function normalize(word: Word): string {
  return word.text.toLowerCase();
}

/*
 * Ham TTR uzunluğa duyarlıdır: metin uzadıkça kaçınılmaz olarak düşer, çünkü
 * "the" ve "and" tekrar etmek zorunda. 50 kelimelik iki metni karşılaştırmak
 * doğru, 50 ile 200 kelimeliği karşılaştırmak yanlış.
 *
 * MATTR (moving-average type-token ratio) bunu çözüyor: sabit genişlikte bir
 * pencereyi metin boyunca kaydırıp her penceredeki TTR'nin ortalamasını alır.
 * Uzunluk artık sonucu bastırmıyor.
 */
export function movingAverageTTR(
  tokens: string[],
  window = MATTR_WINDOW
): number | null {
  if (tokens.length < window) return null;

  let total = 0;
  let windows = 0;

  for (let i = 0; i + window <= tokens.length; i++) {
    const slice = tokens.slice(i, i + window);
    total += new Set(slice).size / window;
    windows++;
  }

  return total / windows;
}

export function measure(text: string): Metrics {
  const allWords = words(text);
  const allSentences = sentences(text);
  const tokens = allWords.map(normalize);

  const wordCount = allWords.length;
  const sentenceCount = allSentences.length;

  const perSentence = allSentences.map((s) => words(s.text).length);
  const longestSentence = perSentence.length > 0 ? Math.max(...perSentence) : 0;

  const subordinators = tokens.filter((t) => SUBORDINATORS.has(t)).length;

  return {
    wordCount,
    sentenceCount,
    avgSentenceLength: sentenceCount === 0 ? 0 : wordCount / sentenceCount,
    longestSentence,
    typeTokenRatio: wordCount === 0 ? 0 : new Set(tokens).size / wordCount,
    movingAverageTTR: movingAverageTTR(tokens),
    subordinationRatio: sentenceCount === 0 ? 0 : subordinators / sentenceCount,
    reliable: wordCount >= RELIABLE_MIN_WORDS,
  };
}
