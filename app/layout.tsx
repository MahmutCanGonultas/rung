import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";

import "./globals.css";

/*
 * İKİ YÜZ, VE ARALARINDAKİ SINIR SES SINIRI.
 *
 *   Bricolage Grotesque → başlıklar, panel başlıkları, büyük okumalar
 *   Manrope             → gövde, etiket, düğme, veri
 *
 * Bricolage karakterli bir display grotesk: harfler hafifçe eğik omuzlu,
 * `wdth` ekseni sayesinde büyük puntoda sıkılaşabiliyor. Ürünün "sıcak ama
 * kesin" tonunu başlık taşıyor; Manrope onun altında sakin ve okunur duruyor.
 *
 * MONO YOK. Önceki iki denemede ölçülen İngilizce ve bütün sayılar daktilo
 * yüzüyle yazılıyordu; sonuç fazla teknik ve soğuk okundu. Ölçülen cümle artık
 * gövde yüzünde ve BÜYÜK — okunacak bir metin gibi duruyor, terminal çıktısı
 * gibi değil.
 *
 * TÜRKÇE KAPSAMI DİSKTEN DOĞRULANDI: `next/font`un `font-data.json` dosyasında
 * iki yüz için de `latin-ext` var (ş ğ İ ı Ş Ğ); ç ö ü zaten `latin` içinde.
 *
 * Font DERLEME ANINDA kendi sunucumuza iniyor — çalışma zamanında Google'a
 * hiçbir istek gitmiyor.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-display",
  /*
   * `axes` var, `weight` YOK: ikisi birlikte verilseydi Next tek bir STATİK
   * kesit indirir ve 64px başlıkla 20px başlık aynı çizimi kullanırdı.
   */
  axes: ["opsz", "wdth"],
});

const body = Manrope({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  /*
   * `metadataBase` ŞART. Paylaşım etiketleri MUTLAK adres istiyor; bu olmadan
   * Next göreli bir yol yazıyor ve WhatsApp, LinkedIn, X hiçbiri onu çözemiyor
   * — link önizlemesi görselsiz çıkıyor.
   *
   * ADRES ORTAM DEĞİŞKENİNDEN. `APP_URL` zaten doğrulama ve şifre sıfırlama
   * bağlantılarının kaynağı; sitenin kendi adresini İKİNCİ bir yerde yazmak,
   * alan adı değiştiğinde birinin eskimesi demekti. Tek yer, tek gerçek.
   *
   * `VERCEL_URL` KULLANILMIYOR: o adres her dağıtımda değişiyor ve önizleme
   * dağıtımlarında paylaşım kartını yanlış adrese çiviliyor.
   */
  metadataBase: new URL(process.env.APP_URL ?? "https://www.rungscale.com"),
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
    <html lang="tr" className={`${display.variable} ${body.variable}`}>
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
