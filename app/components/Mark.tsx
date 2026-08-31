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
 *
 * ═══ SONRADAN BULUNAN İKİ KUSUR ═══
 *
 * 1 · GLİF HİÇ MERDİVEN ÇİZMİYORDU. Yol `fill="none"` ile yazılmış ama CSS
 *     `.mark-steps`e `fill: var(--accent)` verip `stroke` hiç vermemişti —
 *     yani açık yol KONTURLA değil DOLGUYLA çiziliyordu. Dolgu yolu örtük
 *     olarak kapatıyor ve her basamak ayrı bir ÜÇGENE dönüşüyordu. 64px'e
 *     büyütülüp bakıldı: ekranda merdiven değil, çapraz dizilmiş testere
 *     dişleri vardı. Kusur 17px'te fark edilmediği için yıllarca durabilirdi.
 *
 * 2 · DÖRDÜNCÜ BASAMAK KISAYDI. Diğerleri 6 birim, o 4 birimdi. Renk teslimi
 *     köşede olsun diye kısaltılmıştı ama teslim, basamak tam boy olduğunda
 *     da köşede: yol dördüncü basamağın SAĞ UCUNDA bitiyor. Beşi de 6 birim
 *     oldu, kutu 33 → 35 genişledi ve oturma dört yanda simetrikleşti
 *     (1,0 / 1,0 / 1,3 / 1,3).
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
        viewBox="0 0 35 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* Dört basamak, tek yol: sol alttan sağ üste. Kontur ve
            birleşim CSS'te — burada yalnızca geometri. */}
        <path
          className="mark-steps"
          d="M2.5 21.2H8.5V16.6H14.5V12H20.5V7.4H26.5"
        />
        {/* Beşinci: rıht + basamak. Renk teslimi tam köşede. */}
        <path className="mark-next" d="M26.5 7.4V2.8H32.5" />
      </svg>
      <span className="mark-word">
        rung<i>.</i>
      </span>
    </span>
  );
}
