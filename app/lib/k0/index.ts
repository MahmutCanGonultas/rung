import { profile, type BandProfile } from "./bands.ts";
import { measure, type Metrics } from "./metrics.ts";
import { applyRules, dedupeOverlaps } from "./rules.ts";
import { findMisspellings } from "./spelling.ts";
import type { Finding } from "../taxonomy.ts";

/*
 * K0 — deterministik katman.
 *
 * Plan §04: beş katmanın üçü model kullanmıyor, bu ilki. Aynı metin her zaman
 * aynı sonucu verir, bedavadır ve anlıktır. Modele sadece bu katmanın
 * çözemediği kısım gidecek — Aşama 04.
 */

export type K0Result = {
  metrics: Metrics;
  bands: BandProfile;
  findings: Finding[];
  /** 100 kelimede kaç bulgu — metinler arası karşılaştırılabilir tek sayı. */
  findingsPer100Words: number;
};

function spellingFindings(text: string): Finding[] {
  return findMisspellings(text).map((m) => ({
    subcategory: "spelling" as const,
    start: m.start,
    end: m.end,
    original: m.word,
    suggestion: m.suggestions[0] ?? null,
    explanation:
      m.suggestions.length > 0
        ? `Sözlükte yok. Önerilenler: ${m.suggestions.join(", ")}.`
        : "Sözlükte bulunamadı.",
    /*
     * Yazım denetimi ölçüldü: 40 hatalı + 40 doğru kelimede %0 yanlış alarm.
     * Yine de kurallardan biraz düşük güven — özel isim ayıklaması sezgisel.
     */
    confidence: 0.95,
    layer: "K0" as const,
  }));
}

/*
 * Aynı yeri iki bulgu işaret ederse biri elenir.
 *
 * Örnek: "informations" hem sayılabilirlik kuralına hem — sözlükte olmadığı
 * için — yazım denetimine takılabilir. Kullanıcıya aynı kelime için iki kart
 * göstermek, sistemin bir şeyi iki kez saydığı izlenimi verir; ve "hata
 * yoğunluğu" ölçüsünü şişirir.
 *
 * Kural galip: kural neyin yanlış olduğunu ve nedenini biliyor, yazım
 * denetimi sadece "sözlükte yok" diyor.
 */
function dropOverlaps(rules: Finding[], spelling: Finding[]): Finding[] {
  // Kurallar önce: neyin yanlış olduğunu ve nedenini biliyorlar.
  return dedupeOverlaps([...rules, ...spelling]);
}

export function analyze(text: string): K0Result {
  const metrics = measure(text);
  const spelling = spellingFindings(text);
  const findings = dropOverlaps(applyRules(text), spelling);

  // Yanlış yazılmış kelimeler kelime bandı ölçümüne girmiyor.
  const misspelled = new Set(spelling.map((f) => f.original.toLowerCase()));

  return {
    metrics,
    bands: profile(text, misspelled),
    findings,
    findingsPer100Words:
      metrics.wordCount === 0 ? 0 : (findings.length / metrics.wordCount) * 100,
  };
}
