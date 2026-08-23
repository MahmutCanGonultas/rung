import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "../components/AuthForm";
import { loginAction } from "../lib/actions";
import { getSessionUser } from "../lib/session";

export const metadata: Metadata = {
  title: "Giriş · Rung",
};

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard");

  return (
    <main className="auth" id="main">
      <div className="auth-card">
        <h1 className="auth-title">Giriş yap</h1>
        <p className="auth-lede">Kaldığın yerden devam et.</p>

        <AuthForm
          action={loginAction}
          submitLabel="Giriş yap"
          pendingLabel="Kontrol ediliyor…"
          autoComplete="current-password"
        />

        <p className="auth-alt">
          Hesabın yok mu? <Link href="/register">Hesap oluştur</Link>
        </p>
      </div>
    </main>
  );
}
