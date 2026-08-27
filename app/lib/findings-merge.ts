import type { Finding } from "./taxonomy";
import type { StoredFinding } from "./analyses";

/*
 * İki katmanın bulgularını TEK LİSTE hâline getirir.
 *
 * NEDEN: kayıt ekranı bugüne kadar iki ayrı bölüm çiziyordu — "K0 ·
 * deterministik" ve "K1 · model çıkarımı" — her birinin kendi başlığı, kendi
 * sayacı ve hangi katmanın neyi bulamayacağını anlatan kendi paragrafı vardı.
 * Bu ayrım ÜRÜNÜ YAPANIN zihin haritası; yazan kişinin sorusu tek: "ne
 * yanlış?" Katman bilgisi kaybolmuyor (`finding.layer` her satırda duruyor ve
 * ekranda küçük bir künye olarak görünüyor) ama LİSTE bir tane.
 *
 * ÇAKIŞMA: her katman kendi içinde çakışmayı zaten eliyor (`dedupeOverlaps`),
 * ama iki katman AYNI aralığı ayrı ayrı işaretleyebiliyor — "recieved" hem
 * yazım hatası (K0) hem eşdizim adayı (K1) olarak gelebilir. Metnin üstünü
 * çizen `segment()` çakışmayan aralık bekliyor; çakışan iki bulgu ona
 * verilirse metin parçaları negatif uzunlukta dilimlenip bozuluyor.
 *
 * KİM KAZANIR: K0. Deterministik katman kural işletiyor, olasılık değil —
 * "recieved sözlükte yok" cümlesi modelin yorumundan daha kesin. Model bulgusu
 * yalnızca K0'ın dokunmadığı aralıklara giriyor.
 */

export type MergedFinding = Finding & {
  /** K1 bulgularında dolu; K0'da yok. Geri bildirim düğmeleri buna bağlı. */
  id?: string;
  /** İkinci geçişin kararı. K0'da yok — deterministik katman doğrulanmıyor. */
  verdict?: StoredFinding["verdict"];
  /** Kullanıcı ne dedi: true kabul, false itiraz, null cevapsız. */
  agreed?: StoredFinding["agreed"];
};

function overlaps(a: MergedFinding, b: MergedFinding): boolean {
  return a.start < b.end && b.start < a.end;
}

/*
 * `k0` önce, `k1` sonra. Dönen liste metindeki sıraya göre ve GARANTİLİ olarak
 * çakışmasız — `segment()` doğrudan bunu yiyebilir.
 */
export function mergeFindings(
  k0: readonly Finding[],
  k1: readonly StoredFinding[]
): MergedFinding[] {
  const kept: MergedFinding[] = k0.map((f) => ({ ...f, layer: "K0" as const }));

  for (const f of k1) {
    const aday: MergedFinding = {
      ...f,
      layer: "K1" as const,
      id: f.id,
      verdict: f.verdict,
      agreed: f.agreed,
    };
    if (kept.some((k) => overlaps(k, aday))) continue;
    kept.push(aday);
  }

  /*
   * Sıralama metindeki konuma göre. Numaralar (1, 2, 3…) hem metnin üstündeki
   * işaretlerde hem listede kullanılıyor; iki yerin aynı sırayı görmesi şart,
   * yoksa "3 numaralı bulgu" iki farklı şeyi gösteriyor.
   */
  return kept.sort((a, b) => a.start - b.start || a.end - b.end);
}
