import type { StoredFinding } from "../analyses.ts";

/*
 * İkinci geçişin kararına göre bulguları ayırır.
 *
 * Sayfanın içine gömülü kalmasın diye ayrı: bu mantık ürünün en kritik
 * kuralını uyguluyor ve testle bağlanması gerekiyor.
 *
 *   rejected  → kullanıcıya HİÇ gösterilmiyor (yanlış alarm burada kesiliyor)
 *   uncertain → gösteriliyor, ŞÜPHELİ damgalı, sayılmıyor
 *   confirmed → hata sayılıyor
 *   null      → ikinci geçiş çalışmamış; gösteriliyor ama sayılmıyor
 *
 * Son satır önemli: doğrulanmamış bulgu sessizce onaylanmış SAYILMIYOR.
 */

export type Partitioned = {
  visible: StoredFinding[];
  counted: number;
  suspect: number;
  unverified: number;
  filtered: number;
};

export function partitionFindings(findings: StoredFinding[]): Partitioned {
  const visible = findings.filter((f) => f.verdict !== "rejected");

  return {
    visible,
    counted: visible.filter((f) => f.verdict === "confirmed").length,
    suspect: visible.filter((f) => f.verdict === "uncertain").length,
    unverified: visible.filter((f) => f.verdict === null).length,
    filtered: findings.length - visible.length,
  };
}
