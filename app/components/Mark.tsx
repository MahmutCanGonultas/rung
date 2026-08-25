/*
 * Rung işareti.
 *
 * FİKİR AYNI: "rung" merdiven basamağı demek, ürün seviye ölçüyor, glif bir
 * merdiven. Tek sürekli profil kararı korunuyor — beş ayrı çubuk telefon
 * sinyal ikonu gibi okunuyordu. Değişen ÇİZİM, ve üçü de ölçülmüş kusur:
 *
 *   1 · Beşinci parça artık gerçekten BİR ÜST: rıht + basamak. Eskisi
 *       dördüncü basamakla AYNI y'de yatay bir kuyruktu; yorum "ölçüm hep bir
 *       üste bakıyor" diyordu, çizim demiyordu.
 *   2 · Renk teslimi KÖŞEDE. Eskiden iki yol aynı x'te bitip başlıyordu ve
 *       yuvarlak kapaklar 2,6 birim örtüşüyordu — düz çizginin ortasında
 *       çamurlu bir geçiş. Şimdi iki kapak aynı köşe diskini paylaşıyor.
 *   3 · `miter` birleşim. Aralık 5 / kalınlık 2,6'da yuvarlatma her köşenin
 *       %26'sını yiyordu ve 20px'te merdiven çapraz bir lekeye dönüyordu.
 *       Merdiven mimaridir; köşesi diktir.
 *
 * Eğim de 45°'den 37,5°'ye indi (6 basamak / 4,6 rıht): 45° mümkün olan en
 * dik merdiven ve küçük boyda en çok düz çapraza benzeyen açı.
 *
 * Kutuya oturma dört yanda simetrik (1,0 / 1,0 / 1,3 / 1,3), o yüzden
 * `overflow: visible` gerekmiyor.
 */

/** Merdivendeki basamak sayısı. Kenar kertikleri de bu sayıdan besleniyor. */
export const RUNGS = 5;

export function Mark({
  className,
  size = "md",
}: {
  className?: string;
  /** `sm` dar üst çubuk · `md` varsayılan · `lg` kapı ekranının maştı. */
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={["mark", `mark-${size}`, className].filter(Boolean).join(" ")}
    >
      <svg
        className="mark-glyph"
        viewBox="0 0 33 24"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="miter"
        aria-hidden="true"
        focusable="false"
      >
        {/* Dört basamak, tek yol: sol alttan sağ üste. */}
        <path
          className="mark-steps"
          d="M2.5 21.2H8.5V16.6H14.5V12H20.5V7.4H24.5"
        />
        {/* Beşinci: rıht + basamak. Renk teslimi tam köşede. */}
        <path className="mark-next" d="M24.5 7.4V2.8H30.5" />
      </svg>
      <span className="mark-word">
        rung<i>.</i>
      </span>
    </span>
  );
}
