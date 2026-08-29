"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  EMPTY_RECOVER_STATE,
  type RecoverState,
} from "../lib/recover-state";
import { PASSWORD_MIN } from "../lib/validation";

/*
 * Kurtarma formu — iki adım, tek bileşen.
 *
 *   "ask"  → adresini yaz, bağlantı gelsin
 *   "set"  → yeni şifreni yaz
 *
 * İkisi de gerçek `<form>` ve gerçek server action: JavaScript inmeden de
 * çalışıyor. `useActionState` yalnızca hata mesajını ve bekleme durumunu
 * göstermek için — akışın kendisi ona bağlı değil.
 */

type Props = {
  action: (prev: RecoverState, formData: FormData) => Promise<RecoverState>;
  step: "ask" | "set";
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function RecoverForm({ action, step }: Props) {
  const [state, formAction] = useActionState(action, EMPTY_RECOVER_STATE);

  /*
   * GÖNDERİLDİ EKRANI HER ZAMAN AYNI. Adres kayıtlı da olsa değilse de bu
   * cümle çıkıyor: fark, bir kullanıcı listesi çıkarmaya yeterdi.
   */
  if (step === "ask" && state.done) {
    return (
      <div className="form">
        <p className="recover-done">
          Bu adres kayıtlıysa sıfırlama bağlantısını gönderdik. Gelen kutunu ve{" "}
          <b>spam klasörünü</b> kontrol et — bağlantı bir saat geçerli.
        </p>
        <p className="auth-alt">
          Gelmediyse birkaç dakika bekle, sonra tekrar dene.
        </p>
      </div>
    );
  }

  return (
    <form className="form" action={formAction}>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      {step === "ask" ? (
        <div className="field">
          <label className="field-label" htmlFor="email">
            E-posta
          </label>
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.email}
            required
            autoFocus
          />
        </div>
      ) : (
        <div className="field">
          <label className="field-label" htmlFor="password">
            Yeni şifre
          </label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN}
            required
            autoFocus
          />
          <p className="field-hint">En az {PASSWORD_MIN} karakter.</p>
        </div>
      )}

      <SubmitButton
        label={step === "ask" ? "Sıfırlama bağlantısı gönder" : "Şifreyi değiştir"}
        pendingLabel={step === "ask" ? "Gönderiliyor…" : "Değiştiriliyor…"}
      />
    </form>
  );
}
