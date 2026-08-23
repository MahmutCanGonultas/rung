import { LEVELS, type Level } from "../content-types.ts";
import type { Finding, Subcategory } from "../taxonomy.ts";

/*
 * K3 — seviyeye göre süzme ve önceliklendirme.
 *
 * Plan §04: "A1'in cümlesinde on hata vardır; onuncusunu da yüzüne vurursan
 * uygulamayı siler."
 *
 * Plan §06'nın kurucu örneği: "I go to school yesterday."
 *   A1 için  → zaman hatası dersin ta kendisi, mutlaka gösterilmeli
 *   C1 için  → bir dalgınlık; düzeltmek işe yaramıyor, C1'in sorunu başka yerde
 *
 * Yani aynı bulgu, farklı kullanıcıya farklı ağırlıkta. Bu katmanda model yok.
 */

/*
 * Her alt kategorinin hangi seviyede ne kadar önemli olduğu.
 * 0 = bu seviyede gösterilmesin, 3 = bu seviyenin asıl meselesi.
 *
 * Tablo bir tahmin, ve gerçek kullanıcı verisiyle düzeltilecek — ama tahmin
 * olduğu için gizlenmiyor: tek yerde, okunabilir hâlde duruyor.
 */
const PRIORITY: Record<Subcategory, [number, number, number, number, number]> = {
  //                 A1 A2 B1 B2 C1
  agreement:        [3, 3, 2, 1, 1],
  tense:            [3, 3, 2, 1, 1],
  plural:           [3, 2, 2, 1, 1],
  article:          [2, 3, 3, 2, 2],
  preposition:      [2, 3, 3, 2, 2],
  word_order:       [2, 2, 3, 3, 2],
  modal:            [1, 2, 3, 3, 2],

  spelling:         [3, 3, 2, 2, 1],
  punctuation:      [2, 2, 2, 1, 1],
  capitalization:   [3, 2, 2, 1, 1],

  wrong_word:       [2, 3, 3, 3, 3],
  collocation:      [0, 1, 2, 3, 3],
  countability:     [1, 2, 3, 3, 2],
  register:         [0, 0, 1, 3, 3],

  cohesion:         [0, 1, 2, 3, 3],
  repetition:       [1, 1, 2, 2, 3],
  vagueness:        [0, 0, 1, 2, 3],

  // Türkçe kaynaklı hatalar her seviyede önemli: ürünün ayırt edici tarafı,
  // ve kalıcı oldukları için üst seviyede de kaybolmuyorlar.
  article_drop:        [3, 3, 3, 3, 2],
  literal_translation: [2, 3, 3, 3, 3],
  tr_word_order:       [2, 3, 3, 3, 3],
  tr_pattern:          [3, 3, 3, 3, 3],
};

/*
 * Seviyeye göre gösterilecek en fazla bulgu sayısı.
 *
 * A1'e üç, C1'e hepsi. Sayı yükseldikçe kullanıcının taşıyabileceği yük
 * artıyor — ve C1'in zaten az hatası oluyor, sınır nadiren devreye giriyor.
 */
const MAX_SHOWN: Record<Level, number> = {
  A1: 3,
  A2: 4,
  B1: 6,
  B2: 8,
  C1: 12,
};

export function priorityOf(subcategory: Subcategory, level: Level): number {
  const index = LEVELS.indexOf(level);
  return PRIORITY[subcategory][index];
}

export type Filtered<T> = {
  shown: T[];
  hidden: T[];
  /** Sınıra takıldığı için gizlenenler — önemsiz oldukları için değil. */
  overLimit: number;
};

/**
 * Bulguları seviyeye göre süzer ve sıralar.
 *
 * İki ayrı eleme var ve ikisi farklı şeyler:
 *   - öncelik 0 → bu seviyede gürültü, gizleniyor
 *   - sınır aşımı → önemli ama sıraya girmedi, "daha var" diye sayılıyor
 *
 * Karıştırılırsa kullanıcı "bu seviyede önemsiz" ile "bugünlük bu kadar"
 * arasındaki farkı göremez.
 */
export function filterForLevel<T extends { subcategory: Subcategory; confidence: number }>(
  findings: T[],
  level: Level
): Filtered<T> {
  const scored = findings.map((finding) => ({
    finding,
    priority: priorityOf(finding.subcategory, level),
  }));

  const relevant = scored.filter((s) => s.priority > 0);
  const irrelevant = scored.filter((s) => s.priority === 0).map((s) => s.finding);

  relevant.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.finding.confidence - a.finding.confidence;
  });

  const limit = MAX_SHOWN[level];
  const shown = relevant.slice(0, limit).map((s) => s.finding);
  const overLimit = Math.max(0, relevant.length - limit);
  const hidden = [
    ...irrelevant,
    ...relevant.slice(limit).map((s) => s.finding),
  ];

  return { shown, hidden, overLimit };
}

export function limitFor(level: Level): number {
  return MAX_SHOWN[level];
}

/** Ekranda "neden gizlendi" açıklaması için. */
export function hiddenReason(
  finding: Finding,
  level: Level
): "level" | "limit" {
  return priorityOf(finding.subcategory, level) === 0 ? "level" : "limit";
}
