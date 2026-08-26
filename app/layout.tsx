import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"], // latin-ext: ş ğ ı İ ö ü ç
  display: "swap",
  variable: "--font-inter",
});

/*
 * Kitap yüzü — YALNIZCA okunacak şeylerde: başlıklar ve ölçülen İngilizce
 * cümle. İşletilen her şey (etiket, düğme, mono künye, sayı) Inter kalıyor:
 * okunan serif, kullanılan sans.
 *
 * TÜRKÇE KAPSAMI DİSKTEN DOĞRULANDI — `next/font`un kendi `font-data.json`
 * dosyasında Source Serif 4 için `latin-ext` var (İ Ğ ş Ş); ı ç ö ü zaten
 * `latin` içinde. Yedek Georgia da tam Türkçe kapsıyor.
 *
 * `axes: ["opsz"]` var, `weight` YOK: ikisi birlikte verilseydi Next tek bir
 * statik kesit indirir ve 25px başlıkla 50px başlık aynı çizimi kullanırdı.
 *
 * Font DERLEME ANINDA kendi sunucumuza iniyor — çalışma zamanında Google'a
 * hiçbir istek gitmiyor.
 */
const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-serif",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  /*
   * `metadataBase` ŞART. Paylaşım etiketleri MUTLAK adres istiyor; bu olmadan
   * Next göreli bir yol yazıyor ve WhatsApp, LinkedIn, X hiçbiri onu çözemiyor
   * — link önizlemesi görselsiz çıkıyor.
   */
  metadataBase: new URL("https://rung-plum.vercel.app"),
  title: {
    default: "Rung",
    template: "%s",
  },
  description: "Türkçe konuşanlar için İngilizce ölçüm aleti",
  /*
   * Görselin kendisi burada YAZILI DEĞİL: `app/opengraph-image.jpg` dosya adı
   * Next'in kuralı ve etiketi o üretiyor. Dosya değişince meta kendiliğinden
   * değişiyor, elle güncellenecek bir yol kalmıyor. `npm run og` kartı kaynak
   * fotoğraftan türetiyor.
   *
   * X, `twitter:image` yoksa `og:image`e düşüyor — ama yalnızca kart tipi
   * bildirilmişse. Bu satır olmadan büyük görsel yerine küçük özet çıkıyor.
   */
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${serif.variable}`}>
      <body>
        {/*
          Klavyeyle gezen ve ekran okuyucu kullananlar için: her sayfada
          gezinme çubuğunu tek tek geçmek yerine doğrudan içeriğe atlama.
          Odaklanana kadar görünmüyor.
        */}
        <a className="skip" href="#main">
          İçeriğe atla
        </a>
        {children}
      </body>
    </html>
  );
}
