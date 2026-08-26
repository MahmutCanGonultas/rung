import type { CSSProperties } from "react";

import { segment } from "../../lib/k0/segments";
import { type ShowcaseVariant } from "../../lib/k0/showcase-samples";
import { showcaseAnalysis } from "../../lib/showcase-run";
import {
  FAMILIES,
  SUBCATEGORIES,
  labelOf,
  type Family,
  type Subcategory,
} from "../../lib/taxonomy";

/*
 * Vitrin analizi.
 *
 * ÖNEMLİ: burada gösterilen bulgular MAKET DEĞİL. Metin gerçek K0 motorundan
 * geçiyor ve çıkan ne ise o gösteriliyor. Kurallar değişirse bu sayfa da
 * değişir — yani vitrin, ürünün gerçekten yaptığı şeyi göstermek zorunda.
 *
 * Model çağrısı yok: her açılışta aynı sonuç çıkıyor ve sayfanın açılması
 * hiçbir dış servise bağlı değil.
 *
 * Bileşen iki parça döndürüyor (okuma şeridi + bulgu rafı) ve ikisi de
 * çağıran ızgaranın DOĞRUDAN çocuğu oluyor. Bir kaba sarmak mümkün değil:
 * kap `overflow: hidden` ile yeni bir blok biçimlendirme bağlamı açıyor ve
 * raf tek şeritten geniş olamıyor. `display: contents` de çözüm değil —
 * `InView.tsx` sebebini zaten yazıyor.
 */

/* Kadranla aynı sıra: Türkçe kaynaklı aile başta, çünkü alet onlar için. */
const ORDER: Family[] = ["turkish", "grammar", "lexis", "mechanics", "discourse"];
const subsOf = (family: Family) =>
  (Object.keys(SUBCATEGORIES) as Subcategory[]).filter(
    (s) => SUBCATEGORIES[s].family === family
  );

/*
 * Taksonominin kendisi, yuva yuva.
 *
 * Ürünün merkezindeki iddia şu: bulunan her şey ÖNCEDEN KİLİTLENMİŞ bir listede
 * tam bir yere yazılıyor. Bu şerit o listeyi gösteriyor — beş aile, yirmi bir
 * yuva — ve hangilerinin dolduğunu.
 *
 * Asıl işi KARŞILAŞTIRMA: iki bölme aynı şeridi taşıyor. Solda beş yuva dolu,
 * sağda hiçbiri. Aynı ızgara, aynı motor, iki sonuç. Bölümün cümlesi bu ve
 * artık cümle olmaktan çıkıp görülebilen bir şey.
 *
 * Yuva sayısı `SUBCATEGORIES`ten geliyor; taksonomiye alt kategori eklenirse
 * şeride yuva ekleniyor.
 */
function Slots({ hit }: { hit: Set<Subcategory> }) {
  const toplam = (Object.keys(SUBCATEGORIES) as Subcategory[]).length;
  return (
    <p
      className="slots"
      role="img"
      aria-label={
        `Taksonomi: beş ailede ${toplam} alt kategori. ` +
        (hit.size === 0
          ? "Bu cümlede hiçbirine yazılmadı."
          : `Bu cümlede ${hit.size} tanesine yazıldı.`)
      }
    >
      {ORDER.map((family) => (
        <span key={family} className="slot-family" title={FAMILIES[family]}>
          {subsOf(family).map((sub) => (
            <i key={sub} className={hit.has(sub) ? "slot is-hit" : "slot"} />
          ))}
        </span>
      ))}
      <b>
        {toplam} yuva · {hit.size === 0 ? "hiçbiri" : hit.size} dolu
      </b>
    </p>
  );
}

export function SampleAnalysis({
  variant = "broken",
  part = "both",
}: {
  /*
   * `read` okuma şeridi, `shelf` bulgu rafı, `both` ikisi.
   *
   * Kapı ekranı ikisini AYRI yerlere koyuyor: cümle katlamanın üstündeki
   * panele, beş bulgu iki adım aşağıdaki şekle. Anasayfa prop vermiyor ve
   * `both` ile bugünkü davranışını sürdürüyor.
   */
  part?: "read" | "shelf" | "both";
  /*
   * `clean` aynı motordan geçen DOĞRU bir cümle ve sıfır bulgu veriyor.
   * Ürünün kanıtlanamaz iddiası ("doğru cümleyi düzeltmiyoruz") böylece
   * cümle olmaktan çıkıp sayfanın hesapladığı bir olaya dönüşüyor.
   */
  variant?: ShowcaseVariant;
}) {
  const { text, findings } = showcaseAnalysis(variant);
  const parts = segment(text, findings);

  /*
   * Hareketin ritmi GERÇEK VERİDEN geliyor: `--n` bulgu sayısı, `--i` her
   * bulgunun metindeki sırası. Bir K0 kuralı değişip sayı beşten dörde inerse
   * dizinin temposu da onunla değişiyor — sahne değil, ölçümün kendisi.
   *
   * `--n` okuma şeridinde duruyor; özel özellikler miras kaldığı için raf da
   * onu görüyor.
   */
  const read = (
    <div
      className="sample-read"
      style={{ "--n": String(findings.length) } as CSSProperties}
    >
      <div className="sample-head">
        <span className="sample-tag">K0 · deterministik · model yok</span>
        <span className="sample-count">
          {/* Sayı kendi öğesinde: duruşma şeridi onu 52px'e çıkarıyor,
              başka hiçbir yerde ölçüsü değişmiyor. */}
          <b>{findings.length}</b> bulgu
        </span>
      </div>

      <p className="sample-text" lang="en">
        {parts.map((part, i) =>
          part.kind === "plain" ? (
            <span key={i}>{part.text}</span>
          ) : (
            <mark
              key={i}
              className="sample-mark"
              style={{ "--i": String(part.index) } as CSSProperties}
            >
              {part.text}
              <sup>{part.index + 1}</sup>
            </mark>
          )
        )}
      </p>

      {/*
        Şerit YALNIZCA anasayfada (`both`). Kapı ekranı cümleyi ve rafı ayrı
        yerlere koyuyor ve orada taksonomi zaten kendi adımında, yirmi bir
        jetonuyla anlatılıyor — aynı şeyi iki kez göstermenin anlamı yok.
      */}
      {part === "both" ? (
        <Slots hit={new Set(findings.map((f) => f.subcategory))} />
      ) : null}
    </div>
  );

  /*
   * Sıfır bulgu ÖZEL DURUM, boş liste değil.
   *
   * `.sample-findings` zemini `--hairline` ve hücreleri 1px boşlukla ayrılıyor;
   * çocuksuz çizilince ekranda dolu bir çizgi bloğu kalıyor. Boş raf "yüklenmedi"
   * gibi okunuyor, oysa burada boşluk KANITIN KENDİSİ.
   *
   * Cümle "bu cümlede" diyor, "asla yanlış alarm vermez" demiyor: oran ölçülmüş
   * bir sayı ve iki bant aşağıda, kendi koşum künyesiyle duruyor.
   */
  const shelf = findings.length === 0 ? (
    <p className="sample-silent">
      Motor bu cümlede <b>hiçbir şey</b> bulmadı. Uydurulmuş bir düzeltme yok —
      doğru cümle sessizlikle geçiyor.
    </p>
  ) : (
    <div className="sample-findings">
      {findings.map((finding, i) => (
        <div
          key={`${finding.start}-${i}`}
          className="sample-finding"
          style={{ "--i": String(i) } as CSSProperties}
        >
          <div className="sample-kind">
            <span className="sample-no">{i + 1}</span>
            {labelOf(finding.subcategory)}
          </div>
          <div className="sample-fix" lang="en">
            <span className="was">{finding.original}</span>
            {finding.suggestion ? (
              <>
                <span className="arrow">→</span>
                <span className="now">{finding.suggestion}</span>
              </>
            ) : null}
          </div>
          <p className="sample-why">{finding.explanation}</p>
        </div>
      ))}
    </div>
  );

  /*
   * İki parça ızgaranın DOĞRUDAN çocuğu oluyor — tek yerleşim bu.
   *
   * Bir zamanlar `card` diye ikinci bir yerleşim vardı ve ikisini `.sample`
   * kutusuna sarıyordu; anasayfa o kutuyu kullanan son yerdi. Artık iki ekran
   * da parçaları kendi ızgarasına yerleştiriyor, çünkü raf hem kartın altından
   * hem bölmenin içinden tam genişlikte geçmek zorunda — bir kap içinde
   * kalırsa geçemiyor.
   */
  if (part === "read") return read;
  if (part === "shelf") return shelf;
  return (
    <>
      {read}
      {shelf}
    </>
  );
}
