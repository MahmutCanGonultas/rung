import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * `next dev` varsayılan olarak CLAUDE.md'nin sonuna kendi yönergesini
   * ekliyor. CLAUDE.md bu projede elle bakılan bir belge — otomatik blok
   * kapatıldı. Uyarının içeriği kaybolmasın diye belgeye kendi cümlemizle
   * yazıldı: Next.js 16 kırıcı değişiklikler taşıyor ve kendi dokümanını
   * `node_modules/next/dist/docs/` altında getiriyor.
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
  serverExternalPackages: ["nspell", "dictionary-en"],
};

export default nextConfig;
