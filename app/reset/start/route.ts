import { NextResponse } from "next/server";

import { RESET_COOKIE } from "../../lib/recover-cookie";

/*
 * SIFIRLAMA BAĞLANTISININ İNDİĞİ YER.
 *
 * Jeton adres çubuğundan ÇEREZE taşınıyor ve adres temizleniyor. Üç sebep:
 *
 *   1. Formun bulunduğu sayfadan dışarı giden bir istek olursa jeton
 *      `Referer` başlığında sızabiliyordu.
 *   2. Tarayıcı geçmişinde ve paylaşılan bağlantıda jeton kalmıyor.
 *   3. Form gönderimi jetonu gizli alanda taşımak zorunda kalmıyor.
 *
 * NEDEN ROUTE HANDLER: `cookies().set()` Next 16'da server component
 * render'ında çalışmıyor — `ReadonlyRequestCookiesError` fırlatıyor. Çerez
 * ancak bir route handler ya da server action içinde kurulabiliyor.
 *
 * Çerezin ömrü JETONUN ömrüyle aynı (60 dakika). Daha kısası, formu açık
 * bırakan kişinin yazdığı şifreyi boşa düşürüyordu.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  if (!token) {
    return NextResponse.redirect(new URL("/forgot?durum=gecersiz", request.url));
  }

  const response = NextResponse.redirect(new URL("/reset", request.url));
  response.cookies.set(RESET_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return response;
}
