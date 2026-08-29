import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import { RecoverForm } from "../components/RecoverForm";
import { RESET_COOKIE } from "../lib/recover-cookie";
import { resetPasswordAction } from "../lib/recover-actions";

export const metadata: Metadata = { title: "Yeni şifre · Rung" };

/*
 * YENİ ŞİFREYİ YAZ.
 *
 * Jeton adres çubuğunda değil çerezde: buraya `/reset/start` route handler'ı
 * yönlendiriyor ve çerezi o kuruyor. Server component render'ında çerez
 * KURULAMIYOR (Next 16 `ReadonlyRequestCookiesError` fırlatıyor), yalnızca
 * okunabiliyor — burada da sadece okunuyor.
 */
export default async function ResetPage() {
  const jar = await cookies();
  const hasToken = Boolean(jar.get(RESET_COOKIE)?.value);

  return (
    <main className="auth" id="main">
      <div className="auth-card">
        <h1 className="auth-title">Yeni şifre</h1>

        {hasToken ? (
          <>
            <p className="auth-lede">
              Yeni şifreni yaz. Değiştirdiğin anda bütün oturumların
              kapanıyor — başka bir cihazda açık kalmışsa o da düşüyor.
            </p>
            <RecoverForm action={resetPasswordAction} step="set" />
          </>
        ) : (
          <>
            {/*
              Çerez yok: bağlantıya tıklanmadan buraya gelinmiş, ya da bir
              saatlik pencere kapanmış. Kullanıcıya ne olduğunu söylüyoruz ve
              yeniden başlayacağı yeri gösteriyoruz — boş bir form gösterip
              gönderince "geçersiz" demek zaman kaybı olurdu.
            */}
            <p className="auth-lede">
              Bu sayfaya e-postandaki bağlantıyla gelinmesi gerekiyor.
              Bağlantının süresi dolmuş olabilir — bir saat geçerli.
            </p>
            <p className="auth-alt">
              <Link href="/forgot">Yeniden sıfırlama iste →</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
