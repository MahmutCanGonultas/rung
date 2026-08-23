"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { EMPTY_SAVE_STATE, type SaveState } from "../lib/save-state";
import { countWords } from "../lib/words";

/*
 * Yazma alanı. Sınır burada duruyor: sayfanın geri kalanı sunucuda.
 *
 * `countWords` sunucudaki kaydın da kullandığı fonksiyon — sayaçta 74 görüp
 * sunucudan farklı bir sayı almasın diye.
 */

type Props = {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  taskId: string;
  minWords: number;
  maxWords: number;
};

function SaveButton({ words, min }: { words: number; min: number }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="btn btn-primary"
      type="submit"
      disabled={pending || words < min}
    >
      {pending ? "Kaydediliyor…" : "Kaydet"}
    </button>
  );
}

export function Composer({ action, taskId, minWords, maxWords }: Props) {
  const [state, formAction] = useActionState(action, EMPTY_SAVE_STATE);
  const [text, setText] = useState(state.body);

  const words = countWords(text);
  const short = words > 0 && words < minWords;
  const long = words > maxWords;

  return (
    <form className="composer" action={formAction}>
      <input type="hidden" name="taskId" value={taskId} />

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <textarea
        className="editor"
        name="body"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Buraya İngilizce yaz. Sözlük kullanma — ölçtüğümüz şey şu anki hâlin."
        rows={14}
        lang="en"
        spellCheck={false}
        aria-label="Metin"
      />

      <div className="composer-foot">
        <span className="composer-count">
          <b>{words}</b> kelime
          <span className="composer-target">
            {" · hedef "}
            {minWords}–{maxWords}
          </span>
          {short ? <span className="composer-flag">kısa</span> : null}
          {long ? <span className="composer-flag">uzun</span> : null}
        </span>

        <SaveButton words={words} min={10} />
      </div>
    </form>
  );
}
