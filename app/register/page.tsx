import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "../components/AuthForm";
import { GateShell } from "../components/showcase/GateShell";
import { registerAction } from "../lib/actions";
import { getSessionUser } from "../lib/session";
import { PASSWORD_MIN } from "../lib/validation";

export const metadata: Metadata = {
  title: "Hesap oluştur · Rung",
};

export default async function RegisterPage() {
  // Giriş yapmış birinin kayıt sayfasında işi yok.
  if (await getSessionUser()) redirect("/write");

  return (
    <GateShell
      mode="register"
      kicker="İlk ölçüm bugün"
      title="Ölçmeye başla"
      lede="E-posta ve şifre, başka bir şey yok. Yazdığın ilk paragraf aynı zamanda ilk ölçümün oluyor."
      footnote="Doğrulama e-postası yok, kart yok."
    >
      <AuthForm
        action={registerAction}
        submitLabel="Kayıt ol"
        pendingLabel="Oluşturuluyor…"
        autoComplete="new-password"
        passwordHint={`En az ${PASSWORD_MIN} karakter.`}
      />
    </GateShell>
  );
}
