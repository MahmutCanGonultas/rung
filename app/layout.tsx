import type { ReactNode } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import "./globals.css";

/*
 * İKİ YÜZ, VE ARALARINDAKİ SINIR BİR ANLAM SINIRI.
 *
 *   Türkçe olan her şey  → sans
 *   Ölçülen İngilizce metin, HER SAYI, ve künyeler (K0, tense, prompt v1) → mono
 *
 * "Türkçe YAZILIR; İngilizce ve sayı OKUNUR." Önceki sürümde bu ayrımı bir
 * kitap serifi yapıyordu (Source Serif 4) ve ayrım DEKORATİFTİ — başlıklar
 * serif, gövde sans. Şimdi ayrım işlevsel: numune, aletin ekran yüzüyle
 * gösteriliyor. Ürün bir ölçüm aleti; ölçtüğü şey ekranında mono görünür.
 *
 * Aynı süperailenin iki üyesi: ölçüleri, tonu ve rakam çizimi birlikte
 * tasarlanmış. Plex bir MÜHENDİSLİK yüzü — düz yanlı `a`, açılı sonlanmalar,
 * kusursuz tabular rakam.
 *
 * TÜRKÇE KAPSAMI DİSKTEN DOĞRULANDI: `next/font`un kendi `font-data.json`
 * dosyasında iki yüz için de `latin-ext` var (ş ğ İ ı Ş Ğ); ç ö ü zaten
 * `latin` içinde.
 *
 * Font DERLEME ANINDA kendi sunucumuza iniyor — çalışma zamanında Google'a
 * hiçbir istek gitmiyor.
 */
const sans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans",
  /*
   * `axes` var, `weight` YOK: ikisi birlikte verilseydi Next tek bir STATİK
   * kesit indirirdi ve 400 ile 700 arasındaki her ağırlık taklit edilirdi.
   * Böyle tek dosyada bütün ağırlık ve genişlikler geliyor.
   */
  axes: ["wdth"],
});

/*
 * Mono'nun değişken ekseni yok — ağırlıklar tek tek isteniyor. Üçü de
 * kullanılıyor: 400 numune metni, 500 künye ve kalibrasyon rakamı, 600 büyük
 * okuma.
 */
const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600"],
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
    <html lang="tr" className={`${sans.variable} ${mono.variable}`}>
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
