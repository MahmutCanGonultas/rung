import type { ReactNode } from "react";
import Link from "next/link";

import { LevelRule } from "../components/LevelRule";
import { Mark } from "../components/Mark";
import { NavLink } from "../components/NavLink";
import { VerifyBanner } from "../components/VerifyBanner";
import { logoutAction } from "../lib/actions";
import { requireUser } from "../lib/guard";
import { latestEstimate } from "../lib/k3/store";

/*
 * Giriş yapmış kullanıcının kabuğu.
 *
 * `(app)` parantezli klasör: adrese girmiyor. `/write` yine `/write`, ama bu
 * layout'un altında. Amaç ortak çubuğu tek yerde tutmak.
 *
 * Buradaki `requireUser()` kabuğu çizmek için — GÜVENLİK SINIRI DEĞİL. Her
 * sayfa ve her server action kendi kontrolünü ayrıca yapıyor: layout'a
 * güvenmek, kapıyı koridora koymak olurdu.
 *
 * BEŞ HEDEFTEN ÜÇE.
 *
 * Eskiden çubukta Pano · Yaz · Geçmiş · İlerleme · Doğruluk vardı.
 *   - "Pano" Geçmiş'in zayıf kopyasıydı: aynı seviye kartı, aynı kayıt
 *     listesi, artı üç sayaç. Silindi; `/dashboard` artık `/write`e
 *     yönlendiriyor ve giriş yapan kişi doğrudan YAPACAĞI ŞEYE düşüyor.
 *   - "Doğruluk" ALETİN kendi doğruluğu, kullanıcının günlük işi değil. Alta,
 *     altbilgiye indi — ve zaten anasayfanın dördüncü bölümü.
 *
 * Kalan üçü ürünün üç anı: yaz → gör → aylar sonra bak.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  /*
   * Sıralı: seviye sorgusu kullanıcının kimliğine bağlı, paralelleştirilemez.
   * `requireUser()` oturum çerezini zaten okumuş oluyor.
   */
  const user = await requireUser();
  /*
   * `currentLevel()` DEĞİL: o, ölçüm bulamayınca varsayılana düşüyor ve hiç
   * yazmamış birine kendi seviyesi olarak B1 gösteriyordu. Burada ölçümün
   * kendisi okunuyor; yoksa yok.
   */
  const estimate = await latestEstimate(user.id);

  return (
    <div className="shell">
      <header className="shell-bar">
        <Link className="mark-link" href="/write" aria-label="Rung · yazma ekranı">
          <Mark size="sm" />
        </Link>

        <nav className="shell-nav" aria-label="Ekranlar">
          <NavLink href="/write">Yaz</NavLink>
          <NavLink href="/history">Kayıtlar</NavLink>
          <NavLink href="/progress">İlerleme</NavLink>
        </nav>

        <LevelRule level={estimate?.level ?? null} />

        <div className="shell-who">
          <span className="shell-user">{user.email}</span>
          <form action={logoutAction}>
            <button className="shell-out" type="submit">
              Çıkış
            </button>
          </form>
        </div>
      </header>

      <main className="shell-main" id="main">
        {/*
          Doğrulanmamış adres uyarısı içeriğin ÜSTÜNDE ama akışın içinde:
          yapışkan bir katman ya da kapatılabilir bir kutu değil. Kaybolmayan
          ama engellemeyen bir cümle.
        */}
        {user.emailVerifiedAt ? null : (
          <VerifyBanner userId={user.id} email={user.email} />
        )}
        {children}
      </main>

      <footer className="shell-foot">
        <span>Kayıtlar değiştirilemez</span>
        <Link href="/accuracy">Aletin kendi doğruluğu →</Link>
      </footer>
    </div>
  );
}
