/*
 * Hata taksonomisi — plan §05.
 *
 * Kategoriler ÖNCEDEN sabitlenir ve her katman bunlara yazmak zorundadır.
 * Sebep planın kendi cümlesi: "Model bugün 'yanlış edat', yarın 'preposition
 * error' derse hiçbir şey takip edilemez."
 *
 * Bu dosya K0 (deterministik) ve K1 (model) tarafından ortak kullanılıyor.
 * Kodlar değişmez — değişirse aylar öncesinin verisiyle karşılaştırma yalan
 * söyler. Yeni alt kategori eklemek serbest, var olanı yeniden adlandırmak
 * değil.
 */

export const FAMILIES = {
  grammar: "Gramer",
  lexis: "Sözcük",
  mechanics: "Mekanik",
  discourse: "Söylem",
  turkish: "Türkçe kaynaklı",
} as const;

export type Family = keyof typeof FAMILIES;

export const SUBCATEGORIES = {
  // Gramer
  tense: { family: "grammar", label: "zaman" },
  agreement: { family: "grammar", label: "özne-yüklem uyumu" },
  article: { family: "grammar", label: "artikel" },
  preposition: { family: "grammar", label: "edat" },
  plural: { family: "grammar", label: "çoğul" },
  modal: { family: "grammar", label: "kip" },
  word_order: { family: "grammar", label: "sözcük sırası" },

  // Sözcük
  wrong_word: { family: "lexis", label: "yanlış kelime" },
  collocation: { family: "lexis", label: "eşdizim" },
  countability: { family: "lexis", label: "sayılabilirlik" },
  register: { family: "lexis", label: "kayıt uyumu" },

  // Mekanik
  spelling: { family: "mechanics", label: "yazım" },
  punctuation: { family: "mechanics", label: "noktalama" },
  capitalization: { family: "mechanics", label: "büyük harf" },

  // Söylem
  cohesion: { family: "discourse", label: "bağlantı" },
  repetition: { family: "discourse", label: "gereksiz tekrar" },
  vagueness: { family: "discourse", label: "belirsizlik" },

  // Türkçe kaynaklı
  article_drop: { family: "turkish", label: "artikel düşürme" },
  literal_translation: { family: "turkish", label: "birebir çeviri" },
  tr_word_order: { family: "turkish", label: "sözcük sırası" },
  tr_pattern: { family: "turkish", label: "kalıp" },
} as const;

export type Subcategory = keyof typeof SUBCATEGORIES;

export function familyOf(sub: Subcategory): Family {
  return SUBCATEGORIES[sub].family;
}

export function labelOf(sub: Subcategory): string {
  return `${FAMILIES[familyOf(sub)]} · ${SUBCATEGORIES[sub].label}`;
}

/** Bir bulgunun ortak biçimi. K0 ve K1 aynı şekli üretiyor. */
export type Finding = {
  subcategory: Subcategory;
  /** Metindeki konum — bulgular her zaman bir yere çapalanır. */
  start: number;
  end: number;
  original: string;
  suggestion: string | null;
  /** Türkçe açıklama: neden hata. */
  explanation: string;
  /** 0–1. K0 deterministik olduğu için yüksek. */
  confidence: number;
  /** Hangi katman üretti. */
  layer: "K0" | "K1";
};
