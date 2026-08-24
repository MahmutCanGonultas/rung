import type { Metadata } from "next";
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
      mode="register"
      title="Hesap"
      titleSoft="oluştur."
      lede="E-posta ve şifre. Başka bir şey istemiyoruz."
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
