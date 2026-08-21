import Link from "next/link";

import { getSessionUser } from "./lib/session";

/*
 * Anasayfa oturuma bakıyor, yani her istekte çerez okunuyor — Next.js bu sayfayı
 * kendiliğinden dinamik sayar, `force-dynamic` yazmaya gerek yok.
 */
export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <main className="home">
      <div className="home-inner">
        <h1>
          rung<i>.</i>
        </h1>

        <p className="home-lede">
          Kurs değil, sohbet botu değil, yazım denetleyicisi değil. Yazdığın
          İngilizceye bakıp hatayı sabit bir taksonomiye yazan, aylar boyunca
          izleyen ve <b>kendi doğruluğunu ölçen</b> bir alet.
        </p>

        <div className="home-actions">
          {user ? (
            <Link className="btn btn-primary" href="/dashboard">
              Panoya git
            </Link>
          ) : (
            <>
              <Link className="btn btn-primary" href="/register">
                Hesap oluştur
              </Link>
              <Link className="btn" href="/login">
                Giriş yap
              </Link>
            </>
          )}
        </div>

        <p className="home-note">
          {user
            ? `Giriş yapıldı — ${user.email}`
            : "Hesap açmak yirmi saniye sürüyor."}
        </p>
      </div>
    </main>
  );
}
