import type { ReactNode } from "react";
import Link from "next/link";

import { NavLink } from "../components/NavLink";
import { logoutAction } from "../lib/actions";
import { requireUser } from "../lib/guard";

/*
 * Giriş yapmış kullanıcının kabuğu.
 *
 * `(app)` parantezli klasör: adrese girmiyor. `/dashboard` yine `/dashboard`,
 * ama bu layout'un altında. Amaç ortak üst barı tek yerde tutmak.
 *
 * Buradaki `requireUser()` kabuğu çizmek için — güvenlik sınırı DEĞİL.
 * Her sayfa ve her server action kendi kontrolünü ayrıca yapıyor: layout'a
 * güvenmek, kapıyı koridora koymak olurdu.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="shell">
      <header className="shell-bar">
        <Link className="mark" href="/dashboard">
          rung<i>.</i>
        </Link>

        <nav className="shell-nav" aria-label="Ekranlar">
          <NavLink href="/write">Yaz</NavLink>
          <NavLink href="/history">Geçmiş</NavLink>
        </nav>

        <span className="shell-user">{user.email}</span>

        <form action={logoutAction}>
          <button className="btn btn-quiet" type="submit">
            Çıkış
          </button>
        </form>
      </header>

      {children}
    </div>
  );
}
