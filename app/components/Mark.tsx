/*
 * Rung işareti.
 *
 * FİKİR: "rung" İngilizcede merdiven basamağı demek — ve bu ürün seviye
 * ölçüyor. Yani isim zaten ölçeği söylüyor; logo da onu söylesin.
 *
 * Glif beş basamak: A1, A2, B1, B2, C1. Ürünün içinde zaten olan bant ölçeği,
 * hem merdiven hem ölçüm çubuğu olarak okunuyor. Süs değil — logonun anlattığı
 * şey, aletin yaptığı şey.
 *
 * En üst basamak vurgu renginde: ölçüm hep bir sonraki basamağa bakıyor.
 * Diğerleri tek renk — palet zaten kısıtlı ve beş ayrı renk gürültü olurdu.
 *
 * `currentColor` kullanılıyor: işaret hangi metnin içindeyse onun rengini
 * alıyor, iki temada da ayrı kural gerekmiyor.
 */

/** Basamak yükseklikleri (yüzde). Alttan üste doğru artıyor. */
const STEPS = [34, 50, 66, 82, 100];

export function Mark({ className }: { className?: string }) {
  return (
    <span className={className ? `mark ${className}` : "mark"}>
      <svg
        className="mark-glyph"
        viewBox="0 0 22 18"
        aria-hidden="true"
        focusable="false"
      >
        {STEPS.map((h, i) => {
          const top = 18 - (18 * h) / 100;
          return (
            <rect
              key={h}
              x={i * 4.6}
              y={top}
              width="2.6"
              height={18 - top}
              rx="1.3"
              className={i === STEPS.length - 1 ? "mark-top" : undefined}
            />
          );
        })}
      </svg>
      <span className="mark-word">
        rung<i>.</i>
      </span>
    </span>
  );
}
