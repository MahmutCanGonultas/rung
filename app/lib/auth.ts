import "server-only";

import bcrypt from "bcryptjs";

import { db } from "./db";

/*
 * Şifre saklama.
 *
 * Maliyet (cost) 12: bu makinede bir hash ~200 ms sürüyor. Kullanıcı girişte
 * fark etmez; saniyede milyarlarca tahmin deneyen bir saldırgan için aynı sayı
 * duvara dönüşür. Donanım hızlandıkça bu sayı artırılır — her artış işlemi iki
 * katına çıkarır.
 */
const BCRYPT_COST = 12;

/*
 * Var olmayan bir e-postayla giriş denendiğinde de bir bcrypt hesabı yapılsın
 * diye duran sahte hash. Yapılmazsa "kayıtlı olmayan e-posta" anında, "kayıtlı
 * ama şifresi yanlış" 200 ms sonra cevap döner; aradaki fark, hangi
 * e-postaların kayıtlı olduğunu tek tek öğrenmeye yeter.
 */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.7Q5RJ1XkVaKp1w3rY0h9nJ8oQ2xW6Bu";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export type VerifyResult =
  | { ok: true; userId: string }
  | { ok: false };

export async function verifyCredentials(
  email: string,
  password: string
): Promise<VerifyResult> {
  const rows = (await db()`
    SELECT id::text AS id, password_hash
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `) as Array<{ id: string; password_hash: string }>;

  const row = rows[0];

  if (!row) {
    await bcrypt.compare(password, DUMMY_HASH);
    return { ok: false };
  }

  const matches = await bcrypt.compare(password, row.password_hash);
  if (!matches) return { ok: false };

  return { ok: true, userId: row.id };
}
