"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { EMPTY_ACCOUNT_STATE, type AccountState } from "../lib/account-state";
import { PASSWORD_MIN } from "../lib/validation";

/*
 * Şifre değiştirme formu.
 *
 * Sınır burada — sayfada değil. Hesap sayfası sunucu bileşeni olarak kalıyor;
 * tarayıcıya inen tek şey bu form. `useActionState` yalnızca hatayı ve bekleme
 * durumunu göstermek için; akışın kendisi ona bağlı değil, JavaScript inmeden
 * de gerçek bir `<form>` olarak çalışıyor.
 */

type Props = {
  action: (prev: AccountState, formData: FormData) => Promise<AccountState>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? "Değiştiriliyor…" : "Şifreyi değiştir"}
    </button>
  );
}

export function PasswordForm({ action }: Props) {
  const [state, formAction] = useActionState(action, EMPTY_ACCOUNT_STATE);

  /*
   * Başarıdan sonra form KAYBOLUYOR. Yerinde duran boş bir form, "değişti mi
   * değişmedi mi" sorusunu açık bırakıyor; tek satırlık bir onay kapatıyor.
   */
  if (state.done) {
    return (
      <p className="recover-done" role="status">
        Şifren değişti. Bu cihaz dışındaki bütün oturumlar kapatıldı — başka
        bir yerde açık kalmışsa artık değil.
      </p>
    );
  }

  return (
    <form className="form" action={formAction}>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="field">
        <label className="field-label" htmlFor="current">
          Mevcut şifren
        </label>
        <input
          className="input"
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
        />
        {/*
          Oturum açıkken bile soruluyor: oturum "bu kişi giriş yapmıştı" der,
          şifre "bu kişi hâlâ o kişi" der. Açık bırakılmış bir dizüstünün
          başına oturan biri hesabı devralamamalı.
        */}
        <p className="field-hint">
          Açık bırakılmış bir ekranda hesabın devralınmasın diye soruyoruz.
        </p>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="next">
          Yeni şifren
        </label>
        <input
          className="input"
          id="next"
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          required
        />
        <p className="field-hint">En az {PASSWORD_MIN} karakter.</p>
      </div>

      <SubmitButton />
    </form>
  );
}
