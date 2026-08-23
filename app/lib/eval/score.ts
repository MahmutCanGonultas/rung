import type { Finding, Subcategory } from "../taxonomy.ts";

/*
 * İsabet ve yakalama hesabı.
 *
 * Plan §07: "İki sayı: bulduklarının kaçı gerçek hata (isabet), gerçek
 * hataların kaçını yakalamış (yakalama)."
 *
 * Bu dosya modelden, veritabanından ve ağdan tamamen bağımsız — girdi iki
 * liste, çıktı sayılar. Ölçüm aracının kendisi ölçülemezse hiçbir sayıya
 * güvenilmez, o yüzden burası testin en yoğun olduğu yer.
 */

export type Expectation = {
  subcategory: Subcategory;
  original: string;
  start: number;
  end: number;
  /*
   * Tartışmalı beklentiler. Bulunması iyi, bulunmaması yakalamayı
   * düşürmesin — stil sınırındaki şeyler için. Kaçırılırsa ne sayılır ne
   * cezalandırılır.
   */
  optional: boolean;
};

export type Match = {
  expectation: Expectation | null;
  finding: Finding | null;
  /** Aralık örtüştü ama kategori tutmadı mı. */
  categoryMismatch: boolean;
};

export type Score = {
  expected: number;
  found: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  /** Aralığı doğru bulup kategoriyi yanlış koyduğu bulgu sayısı. */
  categoryMismatch: number;
  precision: number;
  recall: number;
  /** Bulduklarının kaçı yanlış alarmdı. ANA ÖLÇÜT — plan §07. */
  falseAlarmRate: number;
  matches: Match[];
};

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && b.start < a.end;
}

/*
 * Eşleştirme kuralı.
 *
 * Bir bulgu ile bir beklenti, metindeki ARALIKLARI örtüşüyorsa eşleşiyor.
 * Kategori ayrı bir soru: aralığı doğru bulup kategoriyi yanlış koymak,
 * hatayı hiç bulamamakla aynı şey değil. İkisini tek sayıya karıştırmak,
 * "bulamadı" ile "yanlış etiketledi" arasındaki farkı yok eder ve prompt'un
 * neresini düzelteceğini bilemezsin.
 *
 * Her beklenti en fazla bir bulguyla eşleşir; aynı hatayı iki kez raporlamak
 * bir kez bulmak sayılıyor, fazlası yanlış alarm.
 */
export function score(expectations: Expectation[], findings: Finding[]): Score {
  const matches: Match[] = [];
  const usedFindings = new Set<number>();

  let truePositive = 0;
  let falseNegative = 0;
  let categoryMismatch = 0;

  for (const expectation of expectations) {
    const index = findings.findIndex(
      (finding, i) => !usedFindings.has(i) && overlaps(expectation, finding)
    );

    if (index === -1) {
      // Tartışmalı beklenti kaçırılırsa yakalamayı düşürmüyor.
      if (!expectation.optional) falseNegative += 1;
      matches.push({ expectation, finding: null, categoryMismatch: false });
      continue;
    }

    usedFindings.add(index);
    const finding = findings[index];
    const mismatch = finding.subcategory !== expectation.subcategory;
    if (mismatch) categoryMismatch += 1;

    truePositive += 1;
    matches.push({ expectation, finding, categoryMismatch: mismatch });
  }

  /*
   * Eşleşmeyen her bulgu yanlış alarm: beklenmediği bir yerde hata gördü.
   * Altın kümedeki TEMİZ paragrafların varlık sebebi bu — hatasız metinde
   * üretilen her bulgu doğrudan yanlış alarm sayısına yazılıyor.
   */
  const falsePositive = findings.reduce(
    (n, _finding, i) => (usedFindings.has(i) ? n : n + 1),
    0
  );

  for (const [i, finding] of findings.entries()) {
    if (!usedFindings.has(i)) {
      matches.push({ expectation: null, finding, categoryMismatch: false });
    }
  }

  const requiredExpected = expectations.filter((e) => !e.optional).length;

  return {
    expected: requiredExpected,
    found: findings.length,
    truePositive,
    falsePositive,
    falseNegative,
    categoryMismatch,
    precision: findings.length === 0 ? 1 : truePositive / findings.length,
    recall: requiredExpected === 0 ? 1 : (requiredExpected - falseNegative) / requiredExpected,
    falseAlarmRate: findings.length === 0 ? 0 : falsePositive / findings.length,
    matches,
  };
}

/** Birden fazla metnin sonucunu tek skora toplar. */
export function total(scores: Score[]): Score {
  const sum = (pick: (s: Score) => number) => scores.reduce((n, s) => n + pick(s), 0);

  const expected = sum((s) => s.expected);
  const found = sum((s) => s.found);
  const truePositive = sum((s) => s.truePositive);
  const falsePositive = sum((s) => s.falsePositive);
  const falseNegative = sum((s) => s.falseNegative);

  return {
    expected,
    found,
    truePositive,
    falsePositive,
    falseNegative,
    categoryMismatch: sum((s) => s.categoryMismatch),
    precision: found === 0 ? 1 : truePositive / found,
    recall: expected === 0 ? 1 : (expected - falseNegative) / expected,
    falseAlarmRate: found === 0 ? 0 : falsePositive / found,
    matches: scores.flatMap((s) => s.matches),
  };
}
