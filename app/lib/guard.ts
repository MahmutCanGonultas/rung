import "server-only";

import { redirect } from "next/navigation";

import { getSessionUser, type SessionUser } from "./session";

/*
 * Korumalı sayfaların tek satırlık kapısı.
 *
 * Kontrol her sayfada ayrı ayrı yapılıyor; ortak bir middleware'e
 * bırakılmıyor. Sebep: middleware'i atlayan bir yol bulunursa bütün sayfalar
 * birden açılır. Kapıyı odanın kendisine koymak, koridora koymaktan güvenli.
 *
 * Bu sadece authentication (kimsin) kontrolü. authorization (bu kayda hakkın
 * var mı) ayrı bir iş ve kaydın sahibine bakarak yapılır — Aşama 02.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
