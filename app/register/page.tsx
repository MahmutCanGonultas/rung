import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "../components/AuthForm";
import { AuthShell } from "../components/showcase/AuthShell";
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
    <AuthShell
      title="Hesap oluştur"
      lede="E-posta ve şifre. Başka bir şey istemiyoruz."
      alt={<>Zaten hesabın var mı? <Link href="/login">Giriş yap</Link></>}
    >
      <AuthForm
        action={registerAction}
        submitLabel="Kayıt ol"
        pendingLabel="Oluşturuluyor…"
        autoComplete="new-password"
        passwordHint={`En az ${PASSWORD_MIN} karakter.`}
      />
    </AuthShell>
  );
}
