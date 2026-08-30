import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { db } from "./db";

/*
 * BEKLEYEN KAYIT — hesap, bağlantıya tıklanana kadar açılmıyor.
 *
 * Önceki model "hesabı aç, sonra doğrula" idi ve `asdasdas@outlook.com` yazan
 * biri veritabanında gerçek bir hesap olarak duruyordu: doğrulanmamış,
 * kurtarılamaz, ama var. Ürün sahibinin isteği açıktı — "gerçek olduğuna emin
 * olduğumuz e-postalar kaydolsun."
 *
 * Bağlantıya tıklanması, o kutunun hem VAR OLDUĞUNUN hem de kişinin ona
 * ERİŞTİĞİNİN tek kanıtı. Kanıt gelmeden hesap yok.
 *
 * Jeton `sessions` ve `auth_tokens` ile aynı kuralda: bağlantıda kendisi,
 * veritabanında SHA-256 özeti.
 */

/*
 * 24 SAAT. İnsanlar postalarına ertesi gün bakıyor ve bu jeton bir hesabı ele
 * geçirmiyor — henüz ortada hesap yok, yalnızca birinin kendi yazdığı şifreyle
 * kendi adresini onaylaması var.
 */
const TTL_MS = 24 * 60 * 60 * 1000;

function hash(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/*
 * Bekleyen kaydı yazıyor ve AYNI ADRESİN eskilerini düşürüyor: kişi üç kez
 * kaydolmayı denerse kutusunda üç çalışan bağlantı birikmesin.
 */
export async function stashSignup(input: {
  email: string;
  passwordHash: string;
}): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);

  await db()`DELETE FROM pending_signups WHERE email = ${input.email}`;

  await db()`
    INSERT INTO pending_signups (token_hash, email, password_hash, expires_at)
    VALUES (
      ${hash(token)},
      ${input.email},
      ${input.passwordHash},
      ${expiresAt.toISOString()}
    )
  `;

  return token;
}

export type ClaimResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; reason: "unknown" | "expired" | "email_taken" };

/*
 * Bağlantıya tıklandı: bekleyen kaydı HESABA çeviriyor.
 *
 * TEK SORGUDA, çünkü "önce oku sonra yaz" iki eşzamanlı tıklamada aynı kaydı
 * iki hesaba çevirebilirdi (kullanıcı bağlantıya iki kez basıyor, ya da posta
 * istemcisi bağlantıları önden getiriyor). `DELETE ... RETURNING` satırı
 * yalnız bir kez veriyor; ikinci istek boş dönüyor.
 *
 * Silmek yerine damgalamıyoruz çünkü burada saklanacak bir şey yok: bekleyen
 * kayıt hesaba dönüştüğü an işlevi bitiyor ve içinde bir şifre özeti duruyor —
 * gereksiz yere tutulan bir sır, tutulmaması gereken bir sırdır.
 */
export async function claimSignup(token: string): Promise<ClaimResult> {
  const rows = (await db()`
    DELETE FROM pending_signups
     WHERE token_hash = ${hash(token)}
    RETURNING email, password_hash, expires_at
  `) as Array<{ email: string; password_hash: string; expires_at: Date }>;

  const row = rows[0];
  if (!row) return { ok: false, reason: "unknown" };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  /*
   * Hesap BURADA açılıyor ve doğrulanmış olarak açılıyor: bağlantıya tıklayan
   * kişi o kutuya erişebiliyor demek, ayrı bir doğrulama turu gereksiz.
   *
   * `ON CONFLICT DO NOTHING`: bekleyen kayıt beklerken aynı adresle başka bir
   * yoldan hesap açılmış olabilir. Yarışı veritabanı çözüyor.
   */
  const made = (await db()`
    INSERT INTO users (email, password_hash, email_verified_at)
    VALUES (${row.email}, ${row.password_hash}, now())
    ON CONFLICT (email) DO NOTHING
    RETURNING id::text AS id
  `) as Array<{ id: string }>;

  const user = made[0];
  if (!user) return { ok: false, reason: "email_taken" };

  return { ok: true, userId: user.id, email: row.email };
}

/** Süresi geçmiş bekleyen kayıtları toplar — içlerinde şifre özeti var. */
export async function sweepPending(): Promise<void> {
  await db()`DELETE FROM pending_signups WHERE expires_at < now()`;
}
