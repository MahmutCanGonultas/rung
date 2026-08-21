"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/*
 * "Şu an bu sekmedesin" işareti için hangi adreste olduğumuzu bilmek gerekiyor
 * ve `usePathname` bir hook — yani istemci tarafı. Sınır bu küçük bileşende
 * duruyor; layout'un tamamı sunucuda kalıyor.
 */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      className={active ? "nav-link is-on" : "nav-link"}
      href={href}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
