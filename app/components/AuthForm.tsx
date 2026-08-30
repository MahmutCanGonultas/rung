"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { CodeForm } from "./CodeForm";
import { EMPTY_FORM_STATE, type FormState } from "../lib/form-state";
import { PASSWORD_MIN } from "../lib/validation";

/*
 * Sınır burada — sayfada değil.
 *
 * Kayıt ve giriş sayfaları sunucu bileşeni olarak kalıyor; tarayıcıya inen tek
 * şey bu form. İçeride veritabanına dokunan hiçbir import yok, olsaydı bağlantı
 * dizesi de tarayıcıya inerdi.
 *
 * `useActionState` sunucudan dönen hatayı formun yanında gösteriyor ve
 * JavaScript yüklenmeden önce de çalışıyor: React formu tarayıcının kendi
 * gönderimiyle yolluyor, hata sayfa yeniden çizilirken görünüyor.
 */

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel: string;
  passwordHint?: string;
  autoComplete: "new-password" | "current-password";
};

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
  passwordHint,
  autoComplete,
}: Props) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  /*
   * GÖNDERİLDİ EKRANI HER ZAMAN AYNI.
   *
   * Adres yeni de olsa, zaten kayıtlı da olsa, hız sınırına takılmış da olsa
   * bu cümle çıkıyor. Fark, sırayla adres deneyerek kimin üye olduğunu
   * öğrenmeye yeterdi — kurtarma yolunda kapattığımız kapı, kayıt yolunda
   * açık kalmasın.
   *
   * Giriş yolunda hiç görünmüyor: orada başarı bir yönlendirme.
   */
  if (state.sent) {
    return (
      <div className="form">
        <p className="recover-done">
          <b>{state.email}</b> adresine bir bağlantı gönderdik. Gelen kutunu ve{" "}
          <b>Gereksiz E-Posta</b> klasörünü kontrol et.
        </p>

        {/*
          KOD, BAĞLANTININ YANINDA — ve bu bir kolaylık değil, bir zorunluluk.

          Gönderim alan adımız yeni ve Outlook maili gereksiz klasörüne
          koyuyor (ölçüldü). İtibar zamanla oluşuyor, satın alınamıyor. O süre
          boyunca bağlantı tek yol olsaydı, junk'a düşen her mail ölü uç
          demekti. Kodla birlikte otuz saniyelik bir sapmaya dönüyor: kişi
          zaten AÇIK DURAN bu sekmeye yazıyor.
        */}
        <CodeForm email={state.email} />

        <p className="auth-alt">
          Mail gereksize düştüyse <b>&ldquo;Gereksiz değil&rdquo;</b> dersen
          bize de yardım etmiş olursun. Hiç gelmediyse birkaç dakika bekle,
          sonra adresini tekrar yaz.
        </p>
      </div>
    );
  }

  return (
    <form className="form" action={formAction} noValidate>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <label className="field">
        <span className="field-label">E-posta</span>
        <input
          className="input"
          type="email"
          name="email"
          defaultValue={state.email}
          autoComplete="email"
          required
          autoFocus
        />
      </label>

      <label className="field">
        <span className="field-label">Şifre</span>
        <input
          className="input"
          type="password"
          name="password"
          autoComplete={autoComplete}
          minLength={PASSWORD_MIN}
          required
        />
        {passwordHint ? <span className="field-hint">{passwordHint}</span> : null}
      </label>

      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
