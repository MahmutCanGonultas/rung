import "server-only";

import { createHash, randomBytes, randomInt } from "node:crypto";

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
 * ALTI HANELİ KOD — bağlantının yanında duran ikinci yol.
 *
 * NEDEN VAR: gönderim alan adı yeni ve mail spam'e düşebiliyor (ölçüldü,
 * Outlook junk'a koydu). Bağlantı tek yolsa junk'a düşen mail ölü uçtur;
 * kodla birlikte otuz saniyelik bir sapmaya dönüyor.
 *
 * `randomInt` KULLANILIYOR, `Math.random()` DEĞİL: ikincisi kriptografik
 * değil ve çıktısı tahmin edilebilir. Altı hane zaten dar bir uzay, bir de
 * zayıf üreteçle daraltmanın anlamı yok.
 *
 * Sıfırla başlayabiliyor ("003914") — `padStart` onu koruyor, yoksa kod
 * ekranda beş haneymiş gibi görünürdü.
 */
function makeCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Beş yanlış denemede bekleyen kayıt tamamen düşüyor. */
const MAX_TRIES = 5;

/*
 * Bekleyen kaydı yazıyor ve AYNI ADRESİN eskilerini düşürüyor: kişi üç kez
 * kaydolmayı denerse kutusunda üç çalışan bağlantı birikmesin.
 */
export async function stashSignup(input: {
  email: string;
  passwordHash: string;
}): Promise<{ token: string; code: string }> {
  const token = randomBytes(32).toString("base64url");
  const code = makeCode();
  const expiresAt = new Date(Date.now() + TTL_MS);

  await db()`DELETE FROM pending_signups WHERE email = ${input.email}`;

  await db()`
    INSERT INTO pending_signups (token_hash, email, password_hash, expires_at, code)
    VALUES (
      ${hash(token)},
      ${input.email},
      ${input.passwordHash},
      ${expiresAt.toISOString()},
      ${code}
    )
  `;

  return { token, code };
}

export type ClaimResult =
  | { ok: true; userId: string; email: string }
  | {
      ok: false;
      reason: "unknown" | "expired" | "email_taken" | "wrong_code" | "burned";
      /** `wrong_code` için: kaç deneme kaldı. */
      left?: number;
    };

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

  return rowToAccount(rows[0]);
}

/*
 * KODLA AÇMA — mail spam'e düştüğünde kullanılan ikinci yol.
 *
 * Bağlantıyla tamamen aynı yere varıyor: aynı satır, aynı hesap, aynı oturum.
 * Fark yalnızca kanıtın nasıl gösterildiği — tıklamak yerine yazmak.
 *
 * ADRES DE SORULUYOR, çünkü kod tek başına altı hane: hangi kayda ait olduğu
 * adresle belirleniyor ve saldırganın "herhangi bir hesap" değil BELİRLİ bir
 * adres için doğru kodu bulması gerekiyor.
 */
export async function claimByCode(
  email: string,
  code: string
): Promise<ClaimResult> {
  /*
   * EŞLEŞME TEK SORGUDA SİLİYOR. "Önce oku sonra sil" iki eşzamanlı denemede
   * aynı kaydı iki hesaba çevirebilirdi.
   */
  const hit = (await db()`
    DELETE FROM pending_signups
     WHERE email = ${email} AND code = ${code}
    RETURNING email, password_hash, expires_at
  `) as Array<{ email: string; password_hash: string; expires_at: Date }>;

  if (hit[0]) return rowToAccount(hit[0]);

  /*
   * Eşleşmedi: ya bu adresin bekleyen kaydı yok, ya kod yanlış. İkisini
   * AYIRMIYORUZ — "bu adresin bekleyen kaydı var" demek, sırayla adres
   * deneyerek kimin kaydolmaya çalıştığını öğrenmeye yeterdi.
   */
  const bumped = (await db()`
    UPDATE pending_signups
       SET code_tries = code_tries + 1
     WHERE email = ${email}
    RETURNING code_tries
  `) as Array<{ code_tries: number }>;

  const tries = bumped[0]?.code_tries;
  if (tries === undefined) return { ok: false, reason: "unknown" };

  if (tries >= MAX_TRIES) {
    /*
     * Hak bitti: kayıt tamamen düşüyor. Altı hane sınırsız denemeye karşı
     * zayıf — koruma kodun uzunluğu değil, deneme sayısı.
     */
    await db()`DELETE FROM pending_signups WHERE email = ${email}`;
    return { ok: false, reason: "burned" };
  }

  return { ok: false, reason: "wrong_code", left: MAX_TRIES - tries };
}

/* Bekleyen kayıt satırını hesaba çeviren ortak adım — iki yol da buraya varıyor. */
async function rowToAccount(
  row: { email: string; password_hash: string; expires_at: Date } | undefined
): Promise<ClaimResult> {
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
