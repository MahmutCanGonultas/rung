import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/*
 * Veritabanı erişimi. Bu dosya `server-only` işaretli: bir istemci bileşeni
 * yanlışlıkla import ederse derleme kırılır, bağlantı dizesi tarayıcıya sessizce
 * inmez. Aşama 01'de en çok konuşulan tuzak buydu.
 *
 * `neon()` bağlantı açmaz — adresi hatırlayan bir fonksiyon üretir. Ağa ilk
 * dokunuş sorgunun kendisinde olur. Bağlantıyı kapatmak gerekmiyor: her sorgu
 * ayrı bir HTTPS isteği, havuz Neon'un geçidinde duruyor.
 */

let cached: NeonQueryFunction<false, false> | null = null;

export function db(): NeonQueryFunction<false, false> {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL tanımlı değil. Yerelde .env.local, canlıda Vercel'in " +
        "Environment Variables panelinde olmalı."
    );
  }

  cached = neon(url);
  return cached;
}
