import { NextResponse } from "next/server";

import { db } from "../lib/db";
import { log } from "../lib/log";
import { getSessionUser } from "../lib/session";
import { consumeToken } from "../lib/tokens";

/*
 * E-POSTA DOĞRULAMA — bağlantının indiği yer.
 *
 * NEDEN ROUTE HANDLER, SAYFA DEĞİL: burada bir yan etki var (jeton tüketiliyor,
 * kullanıcı damgalanıyor). Server component render'ı sırasında yazma yapmak
 * Next'te desteklenmiyor ve olsaydı bile sayfanın her yeniden çiziminde
 * tekrarlanırdı.
 *
 * Sonuç adres çubuğunda bir bayrakla taşınıyor, jeton ORADA KALMIYOR: bağlantı
 * paylaşılırsa ya da tarayıcı geçmişinden okunursa jeton sızmasın.
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
  const to = (durum: string) =>
    NextResponse.redirect(
      new URL(`${signedIn ? "/write" : "/login"}?dogrulama=${durum}`, request.url)
    );

  if (!token) return to("gecersiz");

  try {
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
