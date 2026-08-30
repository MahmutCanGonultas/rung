import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * `next dev` varsayılan olarak proje köküne bir yönerge dosyası yazıyor.
   * Bu depoda belgeler elle bakılıyor — README ve docs/plan.md — o yüzden
   * otomatik üretim kapalı.
   */
  agentRules: false,

  /*
   * `dictionary-en` sözlük dosyalarını (.aff/.dic) modül yüklenirken diskten
   * okuyor ve bunu `import.meta.url`'e göre çözdüğü bir URL ile yapıyor.
   * Paketleyici o okumayı kendi dosya sistemine çevirince kırılıyor:
   *   TypeError: The "path" argument must be ... Received an instance of URL
   *
   * Çözüm paketlememek. Bu iki paket sunucuda normal Node `require`'ı ile
   * yükleniyor; Next.js dağıtıma dosyalarıyla birlikte kopyalıyor.
   */
  serverExternalPackages: ["nspell", "dictionary-en", "dictionary-en-gb"],

  /*
   * TEK KANONİK ADRES — `www` apex'e yönleniyor.
   *
   * NEDEN ŞART, SÜS DEĞİL: oturum çerezi `domain` niteliği olmadan kuruluyor,
   * yani HOST-ONLY — yalnız onu kuran tam adrese gidiyor. İki ad da siteyi
   * sunsaydı `www`'de giriş yapan biri apex'te çıkış yapmış görünürdü. Daha
   * kötüsü: `www`'de kaydolan kişinin doğrulama bağlantısı `APP_URL`den, yani
   * APEX'ten gidiyor; tıklayınca oturumu apex'te açılıyor ve açık duran `www`
   * sekmesinde hâlâ giriş yapmamış oluyordu.
   *
   * NEDEN KODDA, PANELDE DEĞİL: Vercel'in "Redirect to Another Domain"
   * diyaloğu, apex ve www birlikte eklenmeye çalışılınca apex'i kendine
   * yönlendirmiş sayıp reddediyor. Kural burada tek yerde ve `APP_URL`den
   * türüyor — alan adı değişirse yönlendirme kendiliğinden onu izliyor.
   *
   * 308 (permanent): "apex kanonik" bir karar, geçici bir durum değil.
   * Bedeli açık — tarayıcı bunu sıkı önbelleğe alıyor, yani kanonik adı
   * ilerde `www`ye çevirmek istersek eski ziyaretçilerde takılır.
   */
  async redirects() {
    const appUrl = process.env.APP_URL;
    if (!appUrl) return [];

    let host: string;
    try {
      host = new URL(appUrl).host;
    } catch {
      /* Bozuk APP_URL derlemeyi düşürmesin; yönlendirme olmaz, site çalışır. */
      return [];
    }
    /* Kanonik adın kendisi `www` ise yönlendirecek bir şey yok — ve kural
       yazılsaydı sonsuz döngü olurdu. */
    if (host.startsWith("www.")) return [];

    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${host}` }],
        destination: `${appUrl.replace(/\/$/, "")}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
