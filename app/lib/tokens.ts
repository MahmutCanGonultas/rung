import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { db } from "./db";

/*
 * TEK KULLANIMLIK JETONLAR — e-posta doğrulama ve şifre sıfırlama.
 *
 * Bağlantıda jetonun kendisi, veritabanında SHA-256 özeti duruyor: `sessions`
 * tablosundaki karar aynen geçerli. Bir yedek sızarsa oradaki özetlerle ne
 * hesap doğrulanabilir ne şifre sıfırlanabilir.
 *
 * Jeton 32 rastgele bayt olduğu için bcrypt gibi kasıtlı yavaş bir hash
 * gerekmiyor: yavaşlık TAHMİN EDİLEBİLİR girdilere karşı bir savunmadır,
 * 256 bitlik rastgelelikte tahmin edilecek bir şey yok.
 */

export type Purpose = "email_verify" | "password_reset";

/*
 * SÜRELER.
 *
 * Doğrulama 24 saat: insanlar postalarına ertesi gün bakıyor ve bu jeton bir
 * hesabı ele geçirmeye yaramıyor — yalnızca "bu adres gerçekten senin" diyor.
 *
 * Sıfırlama 60 dakika: bu jeton ŞİFREYİ DEĞİŞTİRİYOR, yani hesabın kendisi.
 * Postayı açık bırakılmış bir bilgisayarda bulan biri için pencere dar olmalı.
 * Daha kısası (15 dk) gerçek insanları dışarıda bırakıyor — mail sağlayıcıları
 * teslimi birkaç dakika geciktirebiliyor.
 */
const TTL_MS: Record<Purpose, number> = {
  email_verify: 24 * 60 * 60 * 1000,
  password_reset: 60 * 60 * 1000,
};

function hash(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/*
 * Yeni jeton üretiyor ve AYNI AMAÇTAKİ bekleyenleri düşürüyor.
 *
 * Neden düşürüyor: kullanıcı üç kez "şifremi unuttum" derse kutusunda üç
 * çalışan bağlantı birikiyor ve en eskisi de saatlerce geçerli kalıyor.
 * Yalnızca sonuncusu yaşamalı.
 */
export async function issueToken(input: {
  userId: string;
  email: string;
  purpose: Purpose;
}): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS[input.purpose]);

  await db()`
    UPDATE auth_tokens
       SET consumed_at = now()
     WHERE user_id = ${input.userId}
       AND purpose = ${input.purpose}
       AND consumed_at IS NULL
  `;

  await db()`
    INSERT INTO auth_tokens (token_hash, user_id, purpose, email, expires_at)
    VALUES (
      ${hash(token)},
      ${input.userId},
      ${input.purpose},
      ${input.email},
      ${expiresAt.toISOString()}
    )
  `;

  return token;
}

export type ConsumeResult =
  | { ok: true; userId: string; email: string }
  /*
   * Üç ayrı sebep, üç ayrı cevap.
   *
   * "Zaten kullanılmış" ile "böyle bir jeton yok" ayrı cümleler ve ikisini
   * ayırmak kimseye bir şey sızdırmıyor: jetonu elinde tutan kişi zaten jetonu
   * biliyor. Ayrım olmadan, doğruladıktan sonra sayfayı yenileyen kullanıcıya
   * "bu bağlantı geçersiz" yazıyorduk ve insanlar yeniden mail istiyordu.
   */
  | { ok: false; reason: "unknown" | "used" | "expired" | "email_changed" };

/*
 * Jetonu TÜKETİYOR — tek sorguda, koşullu güncellemeyle.
 *
 * "Önce SELECT sonra UPDATE" yazılsaydı iki eşzamanlı istek aynı jetonu
 * kullanabilirdi (kullanıcı bağlantıya iki kez tıklıyor, ya da posta istemcisi
 * bağlantıları önden getiriyor). `WHERE consumed_at IS NULL` koşulu tüketmeyi
 * atomik yapıyor: yalnız biri satır döndürüyor.
 *
 * `email` KARŞILAŞTIRILIYOR: jeton gönderildiği adrese çivili. Kullanıcı arada
 * adresini değiştirirse eski adrese gitmiş bağlantı yeni adresi doğrulamıyor,
 * yeni adresin şifresini de sıfırlamıyor.
 */
export async function consumeToken(
  token: string,
  purpose: Purpose
): Promise<ConsumeResult> {
  const rows = (await db()`
    UPDATE auth_tokens t
       SET consumed_at = now()
      FROM users u
     WHERE t.token_hash = ${hash(token)}
       AND t.purpose = ${purpose}
       AND t.consumed_at IS NULL
       AND t.expires_at > now()
       AND u.id = t.user_id
       AND u.email = t.email
    RETURNING t.user_id::text AS user_id, t.email
  `) as Array<{ user_id: string; email: string }>;

  const row = rows[0];
  if (row) return { ok: true, userId: row.user_id, email: row.email };

  /*
   * Tüketilemedi. NEDEN olduğunu ayrıca soruyoruz — kullanıcıya doğru cümleyi
   * söyleyebilmek için. Bu ikinci sorgu bir sır sızdırmıyor: jetonu bilmeyen
   * biri buraya hiç gelemiyor.
   */
  const found = (await db()`
    SELECT t.consumed_at,
           t.expires_at,
           (u.email = t.email) AS email_matches
      FROM auth_tokens t
      JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = ${hash(token)}
       AND t.purpose = ${purpose}
     LIMIT 1
  `) as Array<{ consumed_at: Date | null; expires_at: Date; email_matches: boolean }>;

  const info = found[0];
  if (!info) return { ok: false, reason: "unknown" };
  if (info.consumed_at) return { ok: false, reason: "used" };
  if (!info.email_matches) return { ok: false, reason: "email_changed" };
  return { ok: false, reason: "expired" };
}

/** Şifre değişince o kullanıcının bekleyen bütün sıfırlama jetonları düşüyor. */
export async function dropPending(userId: string, purpose: Purpose): Promise<void> {
  await db()`
    UPDATE auth_tokens
       SET consumed_at = now()
     WHERE user_id = ${userId}
       AND purpose = ${purpose}
       AND consumed_at IS NULL
  `;
}
