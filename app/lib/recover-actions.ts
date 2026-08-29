"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { hashPassword } from "./auth";
import { db } from "./db";
import { linkFor, sendMail } from "./email";
import { log } from "./log";
import { allow, sweepAttempts } from "./throttle";
import { consumeToken, dropPending, issueToken } from "./tokens";
import { RESET_COOKIE } from "./recover-cookie";
import type { RecoverState } from "./recover-state";
import { normalizeEmail, readField, validateEmail, validatePassword } from "./validation";

/*
 * ŞİFRE SIFIRLAMA VE E-POSTA DOĞRULAMA — eylemler.
 *
 * BU DOSYANIN TEK BÜYÜK KURALI: hiçbir yanıt "bu adres kayıtlı mı" sorusuna
 * cevap vermiyor. Ne mesaj, ne durum kodu, ne de GEÇEN SÜRE. Kayıtlı adres
 * için mail atılıp kayıtsız için atılmasaydı, iki isteğin süresi arasındaki
 * fark tek başına bir kullanıcı listesi çıkarmaya yeterdi.
 */


async function clientIp(): Promise<string> {
  const h = await headers();
  /*
   * Vercel `x-forwarded-for` başlığını kendisi yazıyor ve ilk değer gerçek
   * istemci. İstemcinin gönderdiği bir başlığa güvenmek olurdu ama bu başlık
   * kenar sunucuda ÜZERİNE yazılıyor.
   */
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim();
}

/* ═══════════════════════════════════════════════════════════════════
   ŞİFREMİ UNUTTUM
   ═══════════════════════════════════════════════════════════════════ */

export async function requestResetAction(
  _prev: RecoverState,
  formData: FormData
): Promise<RecoverState> {
  const email = normalizeEmail(readField(formData, "email"));

  const invalid = validateEmail(email);
  if (invalid) return { error: invalid, done: false, email };

  const ip = await clientIp();

  /*
   * İKİ KOVA, İKİ AYRI İŞ.
   *
   * Adres kovası bir kişinin kutusunun bombalanmasını engelliyor.
   * IP kovası tek kaynaktan yüzlerce adrese mail attırılmasını.
   *
   * IP sınırı bilerek gevşek: Türkiye'de mobil operatörler CGNAT kullanıyor ve
   * yüzlerce gerçek kullanıcı aynı IP'den geliyor. Dar bir sınır saldırganı
   * değil, aynı hattaki insanları keserdi.
   */
  const okEmail = await allow({
    key: `reset:${email}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  const okIp = await allow({
    key: ip ? `reset-ip:${ip}` : "",
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });

  /*
   * Sınıra takıldıysa SESSİZCE düşüyor ve ekran DEĞİŞMİYOR: "çok denedin"
   * demek, o adresin kayıtlı olduğunu söylemenin dolaylı yolu olurdu.
   */
  if (okEmail && okIp) {
    try {
      const rows = (await db()`
        SELECT id::text AS id FROM users WHERE email = ${email} LIMIT 1
      `) as Array<{ id: string }>;

      const user = rows[0];
      if (user) {
        const token = await issueToken({
          userId: user.id,
          email,
          purpose: "password_reset",
        });
        await sendMail({
          to: email,
          subject: "Rung — şifre sıfırlama",
          text:
            `Şifreni sıfırlamak için bu bağlantıya tıkla:\n\n` +
            `${linkFor(`/reset/start?t=${token}`)}\n\n` +
            `Bağlantı bir saat geçerli ve bir kez kullanılabiliyor. ` +
            `Bu isteği sen yapmadıysan hiçbir şey yapmana gerek yok — ` +
            `şifren değişmedi.`,
        });
      }
      void sweepAttempts();
    } catch (error) {
      /*
       * Hata YUKARI FIRLAMIYOR. Kayıtlı adreste patlayıp kayıtsızda
       * patlamayan bir akış, hata ekranının kendisini bir kullanıcı sayacına
       * çevirirdi.
       */
      log.error("reset_request_failed", error, { email });
    }
  }

  return { error: null, done: true, email };
}

/* ═══════════════════════════════════════════════════════════════════
   YENİ ŞİFREYİ YAZ
   ═══════════════════════════════════════════════════════════════════ */

export async function resetPasswordAction(
  _prev: RecoverState,
  formData: FormData
): Promise<RecoverState> {
  const jar = await cookies();
  const token = jar.get(RESET_COOKIE)?.value;
  /*
   * Çerez yok: pencere kapanmış ya da bu sayfaya bağlantısız gelinmiş.
   * Hata mesajı DÖNDÜRMÜYORUZ, yeniden başlanacak yere yolluyoruz — mesajı
   * döndürmek işe yaramıyordu, çünkü sunucu bileşeni yeniden çizilirken
   * "çerez yok" dalına düşüp formu hiç göstermiyordu ve hata kimseye
   * ulaşmıyordu. ÖLÇÜLDÜ: kullanıcı "bağlantıyla gelmelisin" görüyordu,
   * "bu bağlantı zaten kullanılmış" değil.
   */
  if (!token) redirect("/forgot?durum=suresiz");

  const password = readField(formData, "password");
  const weak = validatePassword(password);
  /*
   * ŞİFRE ZAYIFSA JETON HARCANMIYOR: doğrulama, jetonu tüketmeden ÖNCE.
   * Tersi olsaydı kısa şifre yazan kişi bağlantısını yakıyor ve yeniden mail
   * istemek zorunda kalıyordu.
   */
  if (weak) return { error: weak, done: false, email: "" };

  const result = await consumeToken(token, "password_reset");
  if (!result.ok) {
    /*
     * Jeton ölü. Çerez düşüyor ve kullanıcı SEBEBİYLE BİRLİKTE yeniden
     * başlayacağı yere gidiyor: burada bir hata durumu döndürmek, formun
     * artık çizilmediği bir sayfaya mesaj bırakmak olurdu.
     */
    jar.delete(RESET_COOKIE);
    redirect(`/forgot?durum=${result.reason}`);
  }

  try {
    await db()`
      UPDATE users
         SET password_hash = ${await hashPassword(password)},
             -- Sıfırlama bağlantısına tıklayabilen kişi o kutuya erişebiliyor
             -- demek: adres bu adımda kendiliğinden doğrulanmış oluyor. Ayrı
             -- bir doğrulama maili istemek gereksiz bir tur olurdu.
             email_verified_at = coalesce(email_verified_at, now())
       WHERE id = ${result.userId}
    `;

    /*
     * BÜTÜN OTURUMLAR DÜŞÜYOR. Şifre sıfırlamanın asıl sebebi çoğu zaman
     * "hesabıma birinin girdiğinden şüpheleniyorum"; yeni şifre koyup eski
     * oturumu açık bırakmak o kişiyi içeride tutardı.
     */
    await db()`DELETE FROM sessions WHERE user_id = ${result.userId}`;
    await dropPending(result.userId, "password_reset");
  } catch (error) {
    log.error("reset_apply_failed", error, { userId: result.userId });
    return {
      error: "Şifre değiştirilemedi. Biraz sonra tekrar dener misin?",
      done: false,
      email: "",
    };
  }

  jar.delete(RESET_COOKIE);
  redirect("/login?reset=1");
}

/* ═══════════════════════════════════════════════════════════════════
   DOĞRULAMA MAİLİNİ YENİDEN GÖNDER
   ═══════════════════════════════════════════════════════════════════ */

export async function resendVerificationAction(
  userId: string,
  email: string
): Promise<void> {
  const ok = await allow({
    key: `verify:${email}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!ok) return;

  try {
    const token = await issueToken({ userId, email, purpose: "email_verify" });
    await sendMail({
      to: email,
      subject: "Rung — e-posta adresini doğrula",
      text:
        `Adresinin senin olduğunu doğrulamak için bu bağlantıya tıkla:\n\n` +
        `${linkFor(`/verify?t=${token}`)}\n\n` +
        `Bağlantı yirmi dört saat geçerli. Doğrulamadan da yazmaya devam ` +
        `edebilirsin; doğrulama yalnızca şifreni unutursan geri dönebilmen ` +
        `için gerekiyor.`,
    });
  } catch (error) {
    log.error("verify_send_failed", error, { userId });
  }
}
