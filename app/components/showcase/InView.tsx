"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/*
 * Sarmalayıcı: içeriği ekrana girdiğinde üstüne `data-play="1"` basıyor, sonra
 * gözlemciyi kapatıyor.
 *
 * TEK SEFER, bilerek: her kaydırmada tekrar oynayan bir ölçüm ekran koruyucudur,
 * alet değil.
 *
 * Neden gerekli: anasayfadaki üç dizi de sayfa açılır açılmaz başlasaydı,
 * kullanıcı daha başlıktayken bitmiş olurlardı.
 *
 * Neden `children` ile sarıyor: `SampleAnalysis`, `Pipeline` ve veritabanına
 * giden `Proof` böylece sunucu bileşeni olarak kalıyor. İstemciye inen tek şey
 * bu on beş satır.
 *
 * `display: contents` KULLANMIYOR: öyle bir kutu hiç kutu üretmiyor ve
 * IntersectionObserver onu güvenilir şekilde gözleyemiyor.
 */
export function InView({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Gözlemci yoksa hareketi atlayıp bitmiş kareyi göster.
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -18% 0px" }
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} data-play={seen ? "1" : undefined}>
      {children}
    </div>
  );
}
