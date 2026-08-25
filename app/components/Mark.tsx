/*
 * Rung işareti.
 *
 * FİKİR: "rung" İngilizcede merdiven basamağı demek — ve bu ürün seviye
 * ölçüyor. İsim zaten ölçeği söylüyor; işaret de onu söylüyor.
 *
 * NEDEN DEĞİŞTİ: önceki hâli beş yükselen çubuktu ve 96px'e büyütülünce sorun
 * ortaya çıktı — o glif merdiven değil, evrensel TELEFON SİNYAL İKONU gibi
 * okunuyordu. Dört aday çizilip üç ölçüde karşılaştırıldı; iki raylı merdiven
 * 20px'de hamburger menüye, genişleyen yatay çubuklar "hizala" ikonuna
 * benziyordu. Kazanan: tek sürekli yolla çizilmiş merdiven profili. Tek şekil
 * olduğu için 20px'de dağılmıyor, ve hiçbir yaygın ikonla karışmıyor.
 *
 * Son basamak vurgu renginde ve DİĞERLERİNDEN AYRI bir yol: ölçüm hep bir
 * sonraki basamağa bakıyor.
 *
 * `currentColor` kullanılmıyor, `--ink-3` kullanılıyor: işaret metnin içinde
 * ama metin kadar yüksek sesli değil. Vurgu basamağı kendi rengini taşıyor.
 */

export function Mark({ className }: { className?: string }) {
  return (
    <span className={className ? `mark ${className}` : "mark"}>
      <svg
        className="mark-glyph"
        viewBox="0 0 26 20"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {/* Dört basamak, tek yol: sol alttan sağ üste. */}
        <path className="mark-steps" d="M2 18h5v-5h5V8h5V3h2.5" />
        {/* Beşinci basamak — sıradaki. */}
        <path className="mark-next" d="M19.5 3H24" />
      </svg>
      <span className="mark-word">
        rung<i>.</i>
      </span>
    </span>
  );
}
