import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RecoverForm } from "../components/RecoverForm";
import { requestResetAction } from "../lib/recover-actions";
import { getSessionUser } from "../lib/session";

export const metadata: Metadata = { title: "Şifreni sıfırla · Rung" };

/*
 * Ölü bir sıfırlama bağlantısıyla buraya düşen kişiye NE OLDUĞUNU söyleyen
 * satır. Üç sebep üç ayrı cümle: "zaten kullanılmış" ile "geçersiz" ayrı
 * şeyler ve ikisini birbirine söylemek kimseye yardım etmiyor.
 */
const DURUM: Record<string, string> = {
  used: "O bağlantı zaten kullanılmış. Yeni bir tane isteyebilirsin.",
  expired: "Bağlantının süresi dolmuştu — bir saat geçerli. Yeni bir tane isteyebilirsin.",
  suresiz: "Sıfırlama penceresi kapandı. Yeni bir bağlantı isteyebilirsin.",
  unknown: "Bağlantı tanınmadı. Yeni bir tane isteyebilirsin.",
  email_changed: "Bu bağlantı başka bir adres için üretilmişti. Yeni bir tane isteyebilirsin.",
  gecersiz: "Bağlantı eksik ya da bozuk. Yeni bir tane isteyebilirsin.",
};

/*
 * ŞİFREMİ UNUTTUM.
 *
 * Kapı ekranının (`GateShell`) tam sürümü BURADA KULLANILMIYOR: o bileşen her
 * çizimde gerçek K0 analizini ve seviye tahminini koşturuyor — bu sayfanın
 * anlatacak bir şeyi yok, yalnızca bir alan ve bir düğme. Vitrini burada
 * çalıştırmak boşa iş olurdu.
 */
export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  if (await getSessionUser()) redirect("/write");
  const params = await searchParams;
  const durum = params.durum ? DURUM[params.durum] : null;

  return (
    <main className="auth" id="main">
      <div className="auth-card">
        <h1 className="auth-title">Şifreni sıfırla</h1>
        <p className="auth-lede">
          Adresini yaz, sıfırlama bağlantısını gönderelim. Bağlantı bir saat
          geçerli ve bir kez kullanılabiliyor.
        </p>

        {durum ? (
          <p className="gate-news" role="status">
            {durum}
          </p>
        ) : null}

        <RecoverForm action={requestResetAction} step="ask" />

        <p className="auth-alt">
          <Link href="/login">← Giriş ekranına dön</Link>
        </p>
      </div>
    </main>
  );
}
