import { NextResponse } from "next/server";

import { db } from "../lib/db";
import { log } from "../lib/log";
import { createSession, getSessionUser } from "../lib/session";
import { claimSignup } from "../lib/signup";
import { consumeToken } from "../lib/tokens";

/*
 * DOĞRULAMA BAĞLANTISININ İNDİĞİ YER — ve hesabın açıldığı yer.
 *
 * Buraya iki ayrı jeton gelebiliyor ve ikisi de aynı adreste karşılanıyor:
 *
 *   1. BEKLEYEN KAYIT (`pending_signups`) — yeni kayıtlar. Hesap HENÜZ YOK;
 *      bu tıklama onu açıyor ve oturumu başlatıyor. Adres, tıklandığı için
 *      doğrulanmış sayılıyor.
 *
 *   2. DOĞRULAMA JETONU (`auth_tokens`) — bekleyen kayıt modelinden ÖNCE
 *      açılmış hesaplar ve kabuktaki "adresini doğrula" şeridi. Var olan bir
 *      kullanıcıyı damgalıyor.
 *
 * Sıra ÖNEMLİ: önce bekleyen kayda bakılıyor. İkisi aynı jeton uzayını
 * paylaşmıyor (ayrı tablolar, 256 bitlik rastgele jetonlar), o yüzden birinde
 * bulunamayan jetonu ötekinde aramak güvenli.
 *
 * NEDEN ROUTE HANDLER, SAYFA DEĞİL: burada yan etki var (jeton tüketiliyor,
 * satır yazılıyor, çerez kuruluyor). Server component render'ı sırasında
 * yazma yapmak Next'te desteklenmiyor ve olsaydı bile sayfanın her yeniden
 * çiziminde tekrarlanırdı.
 *
 * Sonuç adres çubuğunda bir bayrakla taşınıyor, jeton ORADA KALMIYOR:
 * bağlantı paylaşılırsa ya da tarayıcı geçmişinden okunursa jeton sızmasın.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";

  /*
   * NEREYE DÖNÜLECEĞİ OTURUMA BAĞLI.
   *
   * Hep `/login`e dönülüyordu ve giriş yapmış kişi oradan `/write`e
   * yönlendiriliyordu: sonuç mesajı yolda kayboluyordu. ÖLÇÜLDÜ — bağlantıya
   * tıklayan kullanıcı doğrulandığına dair hiçbir şey görmüyordu.
   */
  const signedIn = Boolean(await getSessionUser());
  const to = (durum: string, forceIn = false) =>
    NextResponse.redirect(
      new URL(
        `${signedIn || forceIn ? "/write" : "/login"}?dogrulama=${durum}`,
        request.url
      )
    );

  if (!token) return to("gecersiz");

  try {
    /* ── 1. Bekleyen kayıt: hesabı BU tıklama açıyor ───────────────── */
    const claimed = await claimSignup(token);
    if (claimed.ok) {
      /*
       * Oturum hemen açılıyor. Kişiyi doğruladıktan sonra bir de giriş
       * ekranına yollamak, kanıtı elimizde tutup kapıyı kapalı bırakmak
       * olurdu — ve şifresini bu sekmede yazmamış olabilir.
       */
      await createSession(claimed.userId);
      return to("hesap", true);
    }
    if (claimed.reason === "expired") return to("suresiz");
    if (claimed.reason === "email_taken") return to("zaten");

    /* ── 2. Var olan hesabın doğrulama jetonu ──────────────────────── */
    const result = await consumeToken(token, "email_verify");
    if (!result.ok) {
      /*
       * "Zaten kullanılmış" AYRI bir cevap. Doğruladıktan sonra sayfayı
       * yenileyen ya da bağlantıya ikinci kez tıklayan kişiye "geçersiz"
       * demek, işi bitmiş birine hata göstermek olurdu.
       */
      return to(result.reason === "used" ? "zaten" : "gecersiz");
    }

    await db()`
      UPDATE users
         SET email_verified_at = coalesce(email_verified_at, now())
       WHERE id = ${result.userId}
    `;
    return to("tamam");
  } catch (error) {
    log.error("verify_failed", error, {});
    return to("hata");
  }
}
