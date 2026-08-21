import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";

import { db } from "./db";

/*
 * Oturum yönetimi.
 *
 * Çerezde jetonun kendisi, veritabanında SHA-256 özeti duruyor. Veritabanı
 * sızarsa oradaki özetlerle oturum açılamaz. Jeton 32 rastgele bayt olduğu için
 * burada bcrypt gibi kasıtlı yavaş bir hash gerekmiyor: yavaşlık tahmin
 * edilebilir girdilere karşı bir savunmadır, rastgele jetonda tahmin edilecek
 * bir şey yok.
 */

const COOKIE_NAME = "rung_session";
const TTL_DAYS = 30;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  email: string;
  createdAt: Date;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);

  await db()`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, ${expiresAt.toISOString()})
  `;

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true, // tarayıcıdaki JavaScript okuyamaz
    secure: process.env.NODE_ENV === "production", // yerelde http, canlıda https
    sameSite: "lax", // başka siteden gelen POST'la oturum kullanılamaz
    path: "/",
    expires: expiresAt,
  });
}

/*
 * `cache` React'in istek başına hafızası: aynı render sırasında bu fonksiyon
 * kaç kez çağrılırsa çağrılsın veritabanına bir kez gidilir. Layout da sorar,
 * sayfa da sorar — sorgu yine tek.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = (await db()`
    SELECT u.id::text AS id, u.email, u.created_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)}
      AND s.expires_at > now()
    LIMIT 1
  `) as Array<{ id: string; email: string; created_at: Date }>;

  const row = rows[0];
  if (!row) return null;

  // Sürücü timestamptz'yi Date olarak veriyor — denenerek doğrulandı, metin değil.
  return { id: row.id, email: row.email, createdAt: row.created_at };
});

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;

  /*
   * Sıra önemli: önce çerez düşer, sonra satır silinir.
   *
   * Tersi olsaydı ve veritabanı o an cevap vermeseydi, "çıkış yap" hata verir
   * ve kullanıcı hâlâ giriş yapmış olarak kalırdı — çıkışın kesinlikle
   * başarısız olmaması gereken tek yönü bu. Bu sırayla en kötü ihtimalde
   * kullanılamaz bir satır süresi dolana kadar bekler; jeton zaten tarayıcıdan
   * gitmiştir.
   */
  jar.delete(COOKIE_NAME);

  if (token) {
    await db()`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  }
}

/** Şifre değişince veya "her yerden çık" denince. */
export async function destroyAllSessionsFor(userId: string): Promise<void> {
  await db()`DELETE FROM sessions WHERE user_id = ${userId}`;
}

/*
 * Süresi geçmiş satırlar kendiliğinden silinmiyor; sorgular `expires_at > now()`
 * dediği için zararsızlar ama birikirler. Bakım işi olarak çağrılır.
 */
export async function purgeExpiredSessions(): Promise<void> {
  await db()`DELETE FROM sessions WHERE expires_at <= now()`;
}
