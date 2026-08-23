import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "../components/AuthForm";
import { registerAction } from "../lib/actions";
import { getSessionUser } from "../lib/session";
import { PASSWORD_MIN } from "../lib/validation";

export const metadata: Metadata = {
  title: "Hesap oluştur · Rung",
};

export default async function RegisterPage() {
  // Giriş yapmış birinin kayıt sayfasında işi yok.
  if (await getSessionUser()) redirect("/dashboard");

  return (
    <main className="auth" id="main">
      <div className="auth-card">
        <h1 className="auth-title">Hesap oluştur</h1>
        <p className="auth-lede">
          Rung yazdığın İngilizceyi ölçer, hatayı sabit bir taksonomiye yazar ve
          aylar boyunca izler.
        </p>

        <AuthForm
          action={registerAction}
          submitLabel="Kayıt ol"
          pendingLabel="Oluşturuluyor…"
          autoComplete="new-password"
          passwordHint={`En az ${PASSWORD_MIN} karakter.`}
        />

        <p className="auth-alt">
          Zaten hesabın var mı? <Link href="/login">Giriş yap</Link>
        </p>
      </div>
    </main>
  );
}
