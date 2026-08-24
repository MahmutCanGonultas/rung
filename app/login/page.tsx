import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "../components/AuthForm";
import { AuthShell } from "../components/showcase/AuthShell";
import { loginAction } from "../lib/actions";
import { getSessionUser } from "../lib/session";

export const metadata: Metadata = {
  title: "Giriş · Rung",
};

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");

  return (
    <AuthShell
      title="Giriş yap"
      lede="Kaldığın yerden devam et."
      alt={<>Hesabın yok mu? <Link href="/register">Hesap oluştur</Link></>}
    >
      <AuthForm
        action={loginAction}
        submitLabel="Giriş yap"
        pendingLabel="Kontrol ediliyor…"
        autoComplete="current-password"
      />
    </AuthShell>
  );
}
