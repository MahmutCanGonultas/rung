import { sentences, words } from "./tokenize.ts";
import type { Finding, Subcategory } from "../taxonomy.ts";

/*
 * Deterministik kurallar — model yok.
 *
 * Seçim ölçütü tek: **yanlış alarm vermeyecek kadar kesin olması.** Plan §07:
 * "Bir hatayı kaçırırsan kullanıcı fark etmez. Ama doğru olan cümlesini
 * düzeltirsen güvenini anında kaybedersin."
 *
 * Bu yüzden burada olmayan çok şey var. "I think that..." fazla mı, değil mi;
 * "very" gereksiz mi — bunlar bağlam ister, K1'in işi. Buradakiler bağlama
 * bakmadan da yanlış olan şeyler.
 */

function finding(
  subcategory: Subcategory,
  start: number,
  end: number,
  original: string,
  suggestion: string | null,
  explanation: string,
  confidence = 0.99
): Finding {
  return {
    subcategory,
    start,
    end,
    original,
    suggestion,
    explanation,
    confidence,
    layer: "K0",
  };
}

/* ── tek başına "i" ─────────────────────────────────────────────────── */
function lowercaseI(text: string): Finding[] {
  const out: Finding[] = [];
  const pattern = /\bi\b/g;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(text)) !== null) {
    out.push(
      finding(
        "capitalization",
        m.index,
        m.index + 1,
        "i",
        "I",
        'İngilizcede birinci tekil şahıs zamiri her yerde büyük yazılır. Türkçede "ben" cümle ortasında küçük kaldığı için sık atlanıyor.'
      )
    );
  }

  return out;
}

/* ── cümle küçük harfle başlıyor ────────────────────────────────────── */
function sentenceCase(text: string): Finding[] {
  const out: Finding[] = [];

  for (const sentence of sentences(text)) {
    const first = sentence.text[0];
    if (!first || !/[a-z]/.test(first)) continue;

    out.push(
      finding(
        "capitalization",
        sentence.start,
        sentence.start + 1,
        first,
        first.toUpperCase(),
        "Cümle büyük harfle başlar."
      )
    );
  }

  return out;
}

/* ── art arda aynı kelime ───────────────────────────────────────────── */
function doubledWord(text: string): Finding[] {
  const out: Finding[] = [];
  const list = words(text);

  for (let i = 1; i < list.length; i++) {
    const previous = list[i - 1];
    const current = list[i];
    if (previous.text.toLowerCase() !== current.text.toLowerCase()) continue;

    // Aradaki boşluk dışında bir şey varsa (nokta, virgül) tekrar sayılmaz.
    const between = text.slice(previous.end, current.start);
    if (!/^\s+$/.test(between)) continue;

    // "had had" ve "that that" İngilizcede geçerli olabiliyor.
    if (["had", "that"].includes(current.text.toLowerCase())) continue;

    out.push(
      finding(
        "repetition",
        previous.start,
        current.end,
        text.slice(previous.start, current.end),
        current.text,
        "Aynı kelime arka arkaya iki kez yazılmış."
      )
    );
  }

  return out;
}

/* ── noktalamadan önce boşluk ───────────────────────────────────────── */
function spaceBeforePunctuation(text: string): Finding[] {
  const out: Finding[] = [];
  const pattern = /\s+([,.;:!?])/g;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(text)) !== null) {
    out.push(
      finding(
        "punctuation",
        m.index,
        m.index + m[0].length,
        m[0],
        m[1],
        "Noktalama işaretinden önce boşluk bırakılmaz."
      )
    );
  }

  return out;
}

/* ── a / an ─────────────────────────────────────────────────────────── */

/* Yazılışı ünlüyle başlayan ama ünsüz sesle okunanlar: "a university". */
const CONSONANT_SOUND = /^(uni|use|user|usual|utili|euro|eula|one|once|ubiqu)/i;
/* Yazılışı ünsüzle başlayan ama ünlü sesle okunanlar: "an hour". */
const VOWEL_SOUND = /^(hour|honest|honou?r|heir|x-ray|mba|mp3|fbi|hr)/i;

function needsAn(word: string): boolean {
  if (VOWEL_SOUND.test(word)) return true;
  if (CONSONANT_SOUND.test(word)) return false;
  return /^[aeiou]/i.test(word);
}

function articleSound(text: string): Finding[] {
  const out: Finding[] = [];
  const pattern = /\b(a|an)\s+([A-Za-z][A-Za-z'-]*)/gi;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(text)) !== null) {
    const article = m[1].toLowerCase();
    const next = m[2];
    const shouldBeAn = needsAn(next);

    if (article === "a" && shouldBeAn) {
      out.push(
        finding(
          "article",
          m.index,
          m.index + 1,
          m[1],
          m[1] === "A" ? "An" : "an",
          `Ünlü sesle başlayan kelimeden önce "an" gelir — "an ${next}".`
        )
      );
    } else if (article === "an" && !shouldBeAn) {
      out.push(
        finding(
          "article",
          m.index,
          m.index + 2,
          m[1],
          m[1] === "An" ? "A" : "a",
          `Ünsüz sesle başlayan kelimeden önce "a" gelir — "a ${next}".`
        )
      );
    }
  }

  return out;
}

/* ── sayılamayan isimlerin çoğulu ───────────────────────────────────── */
const UNCOUNTABLE = [
  "information", "advice", "furniture", "equipment", "knowledge", "research",
  "software", "hardware", "luggage", "baggage", "progress", "feedback",
  "traffic", "weather", "homework", "accommodation", "evidence", "machinery",
  "money", "music", "news", "permission", "pollution", "transport", "vocabulary",
];

function uncountablePlural(text: string): Finding[] {
  const out: Finding[] = [];

  for (const word of words(text)) {
    const lower = word.text.toLowerCase();
    if (!lower.endsWith("s")) continue;
    const singular = lower.slice(0, -1);
    if (!UNCOUNTABLE.includes(singular)) continue;

    out.push(
      finding(
        "countability",
        word.start,
        word.end,
        word.text,
        word.text.slice(0, -1),
        `"${singular}" İngilizcede sayılamayan bir isim, çoğul eki almaz. Türkçede karşılığı sayılabildiği için sık yapılıyor — "bilgiler", "tavsiyeler".`
      )
    );
  }

  return out;
}

/* ── Türkçe kaynaklı sabit kalıplar ─────────────────────────────────── */
const TURKISH_PATTERNS: Array<{
  pattern: RegExp;
  subcategory: Subcategory;
  fix: (match: RegExpExecArray) => string;
  explanation: string;
}> = [
  {
    pattern: /\bI\s+am\s+agree\b/gi,
    subcategory: "tr_pattern",
    fix: () => "I agree",
    explanation:
      '"Katılıyorum" Türkçede sıfat gibi kurulur; İngilizcede "agree" zaten fiil, yanına "am" gelmez.',
  },
  {
    pattern: /\bmake\s+(a\s+)?research\b/gi,
    subcategory: "collocation",
    fix: () => "do some research",
    explanation:
      '"research" hem sayılamaz hem de "make" ile eşdizim kurmaz. Doğrusu "do research" ya da "do some research".',
  },
  {
    pattern: /\bthe\s+(meeting|lesson|class|exam|match|game)\s+of\s+(tomorrow|today|yesterday|next\s+week)\b/gi,
    subcategory: "tr_word_order",
    fix: (m) => `${m[2].replace(/\s+/g, " ")}'s ${m[1]}`,
    explanation:
      '"yarınki toplantı" birebir çevrilmiş. İngilizcede iyelik yapısı doğal olan: "tomorrow\'s meeting".',
  },
  {
    pattern: /\baccording\s+to\s+me\b/gi,
    subcategory: "literal_translation",
    fix: () => "in my opinion",
    explanation:
      '"bana göre" birebir çevrilmiş. "according to" başkasının görüşünü aktarır; kendi görüşün için "in my opinion".',
  },
  {
    pattern: /\bI\s+am\s+living\s+in\s+([A-Z][a-z]+)\s+since\b/g,
    subcategory: "tense",
    fix: (m) => `I have been living in ${m[1]} since`,
    explanation:
      '"since" ile başlayan süre, şimdiki zamanla değil "present perfect continuous" ile kurulur.',
  },
  {
    pattern: /\bdiscuss\s+about\b/gi,
    subcategory: "preposition",
    fix: () => "discuss",
    explanation:
      '"discuss" edat almaz — "discuss the topic". "about" Türkçedeki "hakkında" alışkanlığından geliyor.',
  },
  {
    pattern: /\bexplain\s+me\b/gi,
    subcategory: "preposition",
    fix: () => "explain to me",
    explanation: '"explain" nesneden önce "to" ister — "explain to me".',
  },
];

function turkishPatterns(text: string): Finding[] {
  const out: Finding[] = [];

  for (const rule of TURKISH_PATTERNS) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    let m: RegExpExecArray | null;

    while ((m = pattern.exec(text)) !== null) {
      out.push(
        finding(
          rule.subcategory,
          m.index,
          m.index + m[0].length,
          m[0],
          rule.fix(m),
          rule.explanation,
          0.97
        )
      );
    }
  }

  return out;
}

/*
 * Sıra = öncelik.
 *
 * Aynı yeri birden fazla kural işaretleyebiliyor. Cümle başındaki küçük "i"
 * hem "cümle büyük harfle başlar" hem "I her zaman büyük yazılır" kuralına
 * takılıyor — ve kullanıcıya aynı harf için iki kart çıkıyordu.
 *
 * Çakışmada listede ÖNCE gelen kazanıyor. Sıralama açıklamanın ne kadar
 * öğretici olduğuna göre: Türkçe kaynaklı kalıp > sözcük seçimi > dil bilgisi
 * > mekanik. "I büyük yazılır" bir Türkçe konuşana "cümle büyük başlar"dan
 * daha çok şey anlatıyor, o yüzden önce geliyor.
 */
const RULES = [
  turkishPatterns,
  uncountablePlural,
  articleSound,
  lowercaseI,
  sentenceCase,
  doubledWord,
  spaceBeforePunctuation,
];

/**
 * Çakışan bulguları eler: listede önce gelen kalır.
 *
 * `candidates` öncelik sırasında olmalı. Dönen liste konuma göre sıralıdır.
 */
export function dedupeOverlaps(candidates: Finding[]): Finding[] {
  const kept: Finding[] = [];

  for (const candidate of candidates) {
    const overlaps = kept.some(
      (k) => candidate.start < k.end && k.start < candidate.end
    );
    if (!overlaps) kept.push(candidate);
  }

  return kept.sort((a, b) => a.start - b.start);
}

export function applyRules(text: string): Finding[] {
  return dedupeOverlaps(RULES.flatMap((rule) => rule(text)));
}
