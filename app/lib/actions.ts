"use server";

import { redirect } from "next/navigation";
import { log } from "./log";

import { createUser, verifyCredentials } from "./auth";
import type { FormState } from "./form-state";
import { resendVerificationAction } from "./recover-actions";
import { createSession, destroySession } from "./session";
import {
  normalizeEmail,
  readField,
  validateEmail,
  validatePassword,
} from "./validation";

/*
 * Server Action'lar.
 *
 * `"use server"` bu dosyadaki fonksiyonları, tarayıcıdaki formun doğrudan
 * çağırabileceği sunucu uçlarına çeviriyor. Ayrı bir API rotası yazmak,
 * JSON'a çevirmek, geri okumak yok. Form JavaScript kapalıyken de çalışır.
 *
 * `redirect()` özel bir hata fırlatarak çalışıyor — bu yüzden asla try/catch
 * içinde çağrılmıyor, yoksa kendi catch'imiz yönlendirmeyi yutar.
 */

export async function registerAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = normalizeEmail(readField(formData, "email"));
  const password = readField(formData, "password");

  const emailError = validateEmail(email);
  if (emailError) return { error: emailError, email };

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError, email };

  let userId: string;
  try {
    const created = await createUser(email, password);
    if (!created.ok) {
      return { error: "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.", email };
    }
    userId = created.userId;
    await createSession(userId);

    /*
     * DOĞRULAMA MAİLİ, KAYDIN ARDINDAN — ama hesap KİLİTLENMİYOR.
     *
     * Kilitlenseydi mail gitmeyen ya da spam'e düşen herkes daha ilk adımda
     * dışarıda kalırdı. Doğrulama, hesabın kapısı değil şifreyi unuttuğunda
     * geri dönebilmenin şartı; kabukta sessiz bir şerit onu hatırlatıyor.
     *
     * Gönderim kaydı BLOKLAMIYOR: `sendMail` kendi hatasını yutup rapor
     * ediyor, hesap her hâlükârda açılmış oluyor.
     */
    await resendVerificationAction(userId, email);
  } catch (error) {
    return { error: reportUnexpected("kayıt", error), email };
  }

  redirect("/write");
}

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = normalizeEmail(readField(formData, "email"));
  const password = readField(formData, "password");

  if (email.length === 0 || password.length === 0) {
    return { error: "E-posta ve şifre gerekli.", email };
  }

  /*
   * Giriş yolunda da uzunluk sınırı var. Kayıt yolundaki `validateEmail` /
   * `validatePassword` burada çalışmıyor — kurallar zamanla sıkılaşabilir ve
   * eski hesaplar kilitlenmemeli. Ama saçma uzunlukta bir girdi için bcrypt
   * çalıştırmanın da anlamı yok: sadece boyuta bakıp erken dönüyoruz.
   */
  if (email.length > 254 || password.length > 400) {
    return { error: "E-posta veya şifre hatalı.", email: "" };
  }

  let userId: string;
  try {
    const verified = await verifyCredentials(email, password);
    if (!verified.ok) {
      /*
       * Tek ve aynı mesaj. "Böyle bir kullanıcı yok" ile "şifre yanlış" ayrı
       * yazılırsa, hangi e-postaların kayıtlı olduğu tek tek öğrenilebilir.
       */
      return { error: "E-posta veya şifre hatalı.", email };
    }
    userId = verified.userId;
    await createSession(userId);
  } catch (error) {
    return { error: reportUnexpected("giriş", error), email };
  }

  redirect("/write");
}

export async function logoutAction(): Promise<void> {
  try {
    await destroySession();
  } catch (error) {
    // Çerez `destroySession` içinde en başta düşüyor; buraya gelmişsek
    // tarayıcı tarafı zaten temiz, sadece satır silinememiş olabilir.
    log.error("logout_db_failed", error);
  }

  redirect("/");
}

/*
 * Beklenmeyen hatanın kullanıcıya dönen yüzü.
 *
 * Sunucu günlüğüne tam hata, ekrana sabit bir cümle. Hata metnini olduğu gibi
 * göstermek tablo adlarını, sürücü sürümünü, bazen bağlantı bilgisini sızdırır.
 */
function reportUnexpected(where: string, error: unknown): string {
  log.error("action_failed", error, { where });
  return "Beklenmeyen bir hata oldu. Biraz sonra tekrar dener misin?";
}
