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
};

export default nextConfig;
