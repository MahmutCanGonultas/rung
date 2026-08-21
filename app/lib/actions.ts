"use server";

import { redirect } from "next/navigation";

import { createUser, verifyCredentials } from "./auth";
import type { FormState } from "./form-state";
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

  const created = await createUser(email, password);
  if (!created.ok) {
    return { error: "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.", email };
  }

  await createSession(created.userId);
  redirect("/dashboard");
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

  const verified = await verifyCredentials(email, password);
  if (!verified.ok) {
    /*
     * Tek ve aynı mesaj. "Böyle bir kullanıcı yok" ile "şifre yanlış" ayrı
     * yazılırsa, hangi e-postaların kayıtlı olduğu tek tek öğrenilebilir.
     */
    return { error: "E-posta veya şifre hatalı.", email };
  }

  await createSession(verified.userId);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
