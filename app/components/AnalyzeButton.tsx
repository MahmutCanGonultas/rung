"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  EMPTY_ANALYSIS_STATE,
  type AnalysisState,
} from "../lib/analysis-state";

/*
 * Sınır burada: sayfanın tamamı sunucuda, sadece bu düğme istemcide.
 * "Bekleniyor" durumunu göstermek için `useFormStatus` gerekiyor, o da hook.
 */

function Button({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? "Modele soruluyor…" : label}
    </button>
  );
}

export function AnalyzeButton({
  action,
  entryId,
  label,
}: {
  action: (prev: AnalysisState, formData: FormData) => Promise<AnalysisState>;
  entryId: string;
  label: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_ANALYSIS_STATE);

  return (
    <div className="analyze">
      <form action={formAction}>
        <input type="hidden" name="entryId" value={entryId} />
        <Button label={label} />
      </form>

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
