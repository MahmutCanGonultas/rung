import type { Metadata } from "next";
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
      mode="login"
      title="Giriş"
      titleSoft="yap."
      lede="Kaldığın yerden devam et."
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
