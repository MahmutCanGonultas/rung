import type { Metadata } from "next";
import Link from "next/link";

import { PasswordForm } from "../../components/PasswordForm";
import { changePasswordAction, signOutOthersAction } from "../../lib/account-actions";
import { countEntries } from "../../lib/entries";
import { requireUser } from "../../lib/guard";
import { latestEstimate } from "../../lib/k3/store";
import { countOpenSessions } from "../../lib/session";
import { resendVerificationAction } from "../../lib/recover-actions";

export const metadata: Metadata = { title: "Hesabın · Rung" };

const GUN = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

/*
 * HESAP EKRANI.
 *
 * Üç soruya cevap veriyor, fazlasına değil:
 *   1. Sistem beni kim olarak tanıyor?      → adres ve doğrulama durumu
 *   2. Buraya ne biriktirdim?               → üyelik, kayıt, kelime, seviye
 *   3. Anahtarlarımı nasıl değiştiririm?    → şifre ve açık oturumlar
 *
 * Ayar yok. Değiştirilecek bir tercih yok çünkü ürünün tercihi yok — ölçüm
 * aleti, ayarlanan bir şey değil. Buraya "tema seç" ya da "bildirim" koymak,
 * olmayan bir şeyi varmış gibi göstermek olurdu.
 */
export default async function AccountPage() {
  const user = await requireUser();

  /*
   * Üç sorgu paralel: birbirine bağlı değiller ve hepsi aynı kullanıcıyı
   * okuyor. Sıralı çalıştırmak sayfayı üç gidiş-dönüş bekletirdi.
   */
  const [sayim, tahmin, acikOturum] = await Promise.all([
    countEntries(user.id),
    latestEstimate(user.id),
    countOpenSessions(user.id),
  ]);

  async function resend() {
    "use server";
    await resendVerificationAction(user.id, user.email);
  }

  return (
    <section className="account">
      <h1 className="account-title">Hesabın</h1>

      {/* ── 1 · kimlik ───────────────────────────────────────────── */}
      <div className="account-card">
        <h2 className="account-h">Adres</h2>
        <p className="account-mail">{user.email}</p>

        {user.emailVerifiedAt ? (
          <p className="account-note">
            <span className="account-ok">Doğrulandı</span> ·{" "}
            {GUN.format(user.emailVerifiedAt)}. Şifreni unutursan bu adrese
            sıfırlama bağlantısı gönderebiliriz.
          </p>
        ) : (
          <>
            <p className="account-note">
              <span className="account-warn">Doğrulanmadı.</span> Şifreni
              unutursan geri dönmenin bir yolu olmaz — sıfırlama bağlantısı
              yalnızca doğrulanmış adrese gidiyor.
            </p>
            <form action={resend}>
              <button className="btn btn-quiet" type="submit">
                Doğrulama bağlantısını gönder
              </button>
            </form>
          </>
        )}

        {/*
          Adres DEĞİŞTİRİLEMİYOR ve bu bir eksik değil, bir karar. Adres
          değiştirmek yeni adresin de doğrulanmasını, eskisinin haberdar
          edilmesini ve arada hesabın hangi adrese ait olduğunun belirsiz
          kalmamasını gerektiriyor. Yarım yapılmış bir adres değiştirme,
          hesabı ele geçirmenin en kolay yoludur.
        */}
        <p className="account-fine">
          Adres değiştirme henüz yok. Gerekiyorsa{" "}
          <a href={`mailto:${user.email}`}>bize yaz</a> — doğrulama maillerine
          cevap verebilirsin.
        </p>
      </div>

      {/* ── 2 · birikim ──────────────────────────────────────────── */}
      <div className="account-card">
        <h2 className="account-h">Buraya ne biriktirdin</h2>
        <dl className="account-nums">
          <div>
            <dt>Üyelik</dt>
            <dd>{GUN.format(user.createdAt)}</dd>
          </div>
          <div>
            <dt>Kayıt</dt>
            <dd>{sayim.entries}</dd>
          </div>
          <div>
            <dt>Kelime</dt>
            <dd>{sayim.words.toLocaleString("tr-TR")}</dd>
          </div>
          <div>
            <dt>Ölçülen seviye</dt>
            {/*
              Ölçüm yoksa uydurulmuş bir bant YAZILMIYOR. Ürünün tek cümlelik
              kimliği tam olarak bunu yapmamak.
            */}
            <dd>{tahmin?.level ?? "henüz yok"}</dd>
          </div>
        </dl>
        {sayim.entries === 0 ? (
          <p className="account-fine">
            Henüz hiç yazmadın. <Link href="/write">İlk paragrafını yaz</Link> —
            seviyen o metinden ölçülüyor.
          </p>
        ) : (
          <p className="account-fine">
            <Link href="/progress">İlerlemene bak →</Link>
          </p>
        )}
      </div>

      {/* ── 3 · anahtarlar ───────────────────────────────────────── */}
      <div className="account-card">
        <h2 className="account-h">Şifre</h2>
        <PasswordForm action={changePasswordAction} />
      </div>

      <div className="account-card">
        <h2 className="account-h">Açık oturumlar</h2>
        <p className="account-note">
          {acikOturum === 1
            ? "Yalnızca bu cihazda açıksın."
            : `${acikOturum} cihazda açıksın — bu cihaz dâhil.`}{" "}
          Ortak bir bilgisayarda çıkış yapmayı unuttuysan buradan kapatabilirsin.
        </p>
        {acikOturum > 1 ? (
          <form action={signOutOthersAction}>
            <button className="btn btn-quiet" type="submit">
              Diğer cihazlardan çık
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
