import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "../components/AuthForm";
import { GateShell } from "../components/showcase/GateShell";
import { loginAction } from "../lib/actions";
import { getSessionUser } from "../lib/session";

export const metadata: Metadata = {
  title: "Giriş · Rung",
};

/*
 * Kapıya dönen kişiye NE OLDUĞUNU söyleyen mesajlar.
 *
 * Doğrulama ve sıfırlama akışları buraya bir bayrakla dönüyor; jeton adres
 * çubuğunda taşınmıyor. Her durum ayrı cümle: "zaten doğrulanmış" ile
 * "geçersiz bağlantı" ayrı şeyler ve ikincisini birinciye söylemek, işi
 * bitmiş birine hata göstermek olurdu.
 */
const HABER: Record<string, string> = {
  tamam: "E-posta adresin doğrulandı. Artık şifreni unutsan da geri dönebilirsin.",
  zaten: "Bu adres zaten doğrulanmış. Giriş yapabilirsin.",
  suresiz:
    "O bağlantının süresi dolmuştu — yirmi dört saat geçerliydi. Yeniden kaydolabilirsin.",
  gecersiz:
    "Bağlantı geçersiz ya da süresi dolmuş. Yeniden kaydolabilir, hesabın varsa giriş yapıp yeni bir doğrulama isteyebilirsin.",
  hata: "Doğrulama sırasında bir şey ters gitti. Biraz sonra tekrar dener misin?",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ dogrulama?: string; reset?: string }>;
}) {
  if (await getSessionUser()) redirect("/write");
  const params = await searchParams;
  const haber = params.dogrulama ? HABER[params.dogrulama] : null;
  const sifirlandi = params.reset === "1";

  return (
    <GateShell
      mode="login"
      kicker="Kayıtların yerinde"
      title="Tekrar hoş geldin"
      lede="Bıraktığın yerden devam ediyorsun. Bir kayıt, yazıldığı gün neyse o kalıyor."
    >
      {haber ? (
        <p className="gate-news" role="status">
          {haber}
        </p>
      ) : null}
      {sifirlandi ? (
        <p className="gate-news" role="status">
          Şifren değiştirildi. Yeni şifrenle giriş yapabilirsin.
        </p>
      ) : null}

      <AuthForm
        action={loginAction}
        submitLabel="Giriş yap"
        pendingLabel="Kontrol ediliyor…"
        autoComplete="current-password"
      />

      <p className="gate-forgot">
        <Link href="/forgot">Şifreni mi unuttun?</Link>
      </p>
    </GateShell>
  );
}
