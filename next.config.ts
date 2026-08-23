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
  serverExternalPackages: ["nspell", "dictionary-en"],
};

export default nextConfig;
