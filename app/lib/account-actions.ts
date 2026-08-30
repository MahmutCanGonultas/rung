"use server";

import { revalidatePath } from "next/cache";

import { hashPassword, verifyCredentials } from "./auth";
import { db } from "./db";
import { log } from "./log";
import { requireUser } from "./guard";
import { currentSessionHash } from "./session";
import { allow } from "./throttle";
import type { AccountState } from "./account-state";
import { readField, validatePassword } from "./validation";

/*
 * HESAP EKRANININ EYLEMLERİ.
 *
 * Buradaki her şey oturumu OLAN kişi için. `requireUser()` her eylemin
 * başında ayrıca çağrılıyor — kabuk zaten çağırıyor ama layout bir güvenlik
 * sınırı değil, sadece çizim. Bir server action doğrudan da çağrılabiliyor.
 */

/* ═══════════════════════════════════════════════════════════════════
   ŞİFRE DEĞİŞTİR
   ═══════════════════════════════════════════════════════════════════ */

export async function changePasswordAction(
  _prev: AccountState,
  formData: FormData
): Promise<AccountState> {
  const user = await requireUser();

  const current = readField(formData, "current");
  const next = readField(formData, "next");

  if (current.length === 0) {
    return { error: "Mevcut şifreni yazman gerekiyor.", done: false };
  }

  const weak = validatePassword(next);
  /*
   * YENİ ŞİFRE ÖNCE DOĞRULANIYOR, mevcut şifre SONRA kontrol ediliyor.
   * Tersi olsaydı kısa bir şifre yazan kişi boşuna bir bcrypt karşılaştırması
   * bekliyordu — ve hız sınırı kovasından bir hak yakıyordu.
   */
  if (weak) return { error: weak, done: false };

  if (current === next) {
    return { error: "Yeni şifre eskisiyle aynı olamaz.", done: false };
  }

  /*
   * HIZ SINIRI. Bu uç, oturumu ELE GEÇİRMİŞ birinin mevcut şifreyi tahmin
   * etmeye çalışacağı yer: çerezi olan ama şifreyi bilmeyen biri. Sınırsız
   * bırakılsaydı bcrypt'in yavaşlığı tek başına yeterli olmazdı.
   *
   * Anahtar kullanıcı kimliğinde, adreste değil — adres değişebilir, kimlik
   * değişmez.
   */
  const ok = await allow({
    key: `pwchange:${user.id}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!ok) {
    return {
      error: "Çok fazla deneme oldu. On beş dakika sonra tekrar dene.",
      done: false,
    };
  }

  /*
   * MEVCUT ŞİFRE SORULUYOR — oturum açık olsa bile.
   *
   * Açık bırakılmış bir dizüstünün başına oturan biri, şifreyi bilmeden
   * hesabı devralamamalı. Oturum "bu kişi giriş yapmıştı" diyor; şifre "bu
   * kişi HÂLÂ o kişi" diyor. İkisi ayrı sorular.
   */
  const verified = await verifyCredentials(user.email, current);
  if (!verified.ok) {
    return { error: "Mevcut şifre hatalı.", done: false };
  }

  try {
    await db()`
      UPDATE users SET password_hash = ${await hashPassword(next)}
       WHERE id = ${user.id}
    `;

    /*
     * BU OTURUM DIŞINDA HEPSİ DÜŞÜYOR.
     *
     * Şifre değiştirmenin en sık sebebi "hesabıma birinin girdiğinden
     * şüpheleniyorum". Yeni şifre koyup öteki oturumu açık bırakmak o kişiyi
     * içeride tutardı. Kendi oturumumuz kalıyor: kullanıcıyı kendi
     * eyleminden dolayı dışarı atmak bir ceza gibi okunuyor.
     */
    const keep = await currentSessionHash();
    if (keep) {
      await db()`
        DELETE FROM sessions
         WHERE user_id = ${user.id} AND token_hash <> ${keep}
      `;
    }
  } catch (error) {
    log.error("password_change_failed", error, { userId: user.id });
    return {
      error: "Şifre değiştirilemedi. Biraz sonra tekrar dener misin?",
      done: false,
    };
  }

  revalidatePath("/account");
  return { error: null, done: true };
}

/* ═══════════════════════════════════════════════════════════════════
   DİĞER OTURUMLARI KAPAT
   ═══════════════════════════════════════════════════════════════════ */

/*
 * Şifreyi değiştirmeden de "başka yerde açık kalmış olabilir" diyen biri
 * için. Şifre sormuyoruz: bu eylem hesabı ele geçirmiyor, TERSİNE herkesi
 * dışarı atıyor — en kötü ihtimalle kişi kendi öteki cihazından tekrar giriş
 * yapar. Şifre istemek, tehlikeyi azaltmadan işi zorlaştırmak olurdu.
 */
export async function signOutOthersAction(): Promise<void> {
  const user = await requireUser();
  try {
    const keep = await currentSessionHash();
    if (!keep) return;
    await db()`
      DELETE FROM sessions
       WHERE user_id = ${user.id} AND token_hash <> ${keep}
    `;
  } catch (error) {
    log.error("signout_others_failed", error, { userId: user.id });
  }
  revalidatePath("/account");
}
