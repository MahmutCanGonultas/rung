import { resendVerificationAction } from "../lib/recover-actions";

/*
 * DOĞRULAMA ŞERİDİ — sessiz, kapatılabilir değil, engelleyici değil.
 *
 * Hesap doğrulanmadan da tamamen çalışıyor: kilitlemek, maili gitmeyen ya da
 * spam'e düşen herkesi ilk adımda dışarıda bırakırdı. Ama doğrulanmamış bir
 * adres, şifre unutulduğunda GERİ DÖNÜŞ YOLU OLMADIĞI anlamına geliyor ve
 * bunu kullanıcının bilmesi gerekiyor. Şerit onu bir cümleyle söylüyor.
 *
 * Yeniden gönderme gerçek bir `<form>` ve gerçek bir server action:
 * JavaScript inmeden de çalışıyor.
 */
export function VerifyBanner({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  async function resend() {
    "use server";
    await resendVerificationAction(userId, email);
  }

  return (
    <div className="verify" role="status">
      <p className="verify-text">
        <b>{email}</b> adresini henüz doğrulamadın. Şifreni unutursan geri
        dönebilmen için gerekiyor — gelen kutunu ve spam klasörünü kontrol et.
      </p>
      <form action={resend}>
        <button className="btn btn-quiet" type="submit">
          Yeniden gönder
        </button>
      </form>
    </div>
  );
}
