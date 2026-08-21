"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

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
