"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { verifySignupCodeAction } from "../lib/actions";
import { EMPTY_FORM_STATE } from "../lib/form-state";

/*
 * MAİLDEKİ KODU GİRME.
 *
 * Bağlantının yerine değil YANINA. Bağlantı hâlâ tek tıkla çalışıyor ve hâlâ
 * tercih edilen yol; bu, mail gereksiz klasörüne düştüğünde ya da kişi maile
 * başka bir cihazdan baktığında kalan ikinci kapı.
 *
 * Adres GİZLİ ALANDA taşınıyor. Kullanıcının kontrolünde olması sorun değil:
 * kod zaten o adrese gitti ve doğru kodu bilmeden hiçbir şey açılmıyor.
 *
 * `inputMode="numeric"` telefonda sayı tuş takımını açıyor; `autoComplete`
 * tek kullanımlık kod anlamına geliyor ve iOS/Android maildeki kodu klavyenin
 * üstünde önerip tek dokunuşla dolduruyor.
 */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-quiet" type="submit" disabled={pending}>
      {pending ? "Bakılıyor…" : "Kodu gir"}
    </button>
  );
}

export function CodeForm({ email }: { email: string }) {
  const [state, formAction] = useActionState(
    verifySignupCodeAction,
    EMPTY_FORM_STATE
  );

  return (
    <form className="codebox" action={formAction}>
      <input type="hidden" name="email" value={email} />

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <label className="field-label" htmlFor="code">
        Ya da maildeki altı haneli kodu yaz
      </label>
      <div className="codebox-row">
        <input
          className="input code-input"
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={7}
          placeholder="000000"
          aria-describedby="code-hint"
        />
        <SubmitButton />
      </div>
      <p className="field-hint" id="code-hint">
        Bağlantıyla aynı yere çıkıyor.
      </p>
    </form>
  );
}
