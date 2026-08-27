import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "../components/AuthForm";
import { GateShell } from "../components/showcase/GateShell";
import { loginAction } from "../lib/actions";
import { getSessionUser } from "../lib/session";

export const metadata: Metadata = {
  title: "Giriş · Rung",
};

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/write");

  return (
    <GateShell
      mode="login"
      kicker="Kayıtların yerinde"
      title="Tekrar hoş geldin"
      lede="Bıraktığın yerden devam ediyorsun. Bir kayıt, yazıldığı gün neyse o kalıyor."
    >
      <AuthForm
        action={loginAction}
        submitLabel="Giriş yap"
        pendingLabel="Kontrol ediliyor…"
        autoComplete="current-password"
      />
    </GateShell>
  );
}
