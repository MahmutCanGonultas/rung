import { noteWordAction } from "../lib/vocab/note-actions";

/*
 * "Deftere al" düğmesi.
 *
 * Düz bir <form>, tıpkı itiraz düğmeleri gibi: JavaScript kapalıyken de
 * çalışıyor. Bant ve küçük harfli anahtar buradan GÖNDERİLMİYOR — sunucu
 * hesaplıyor.
 *
 * `back`: işlem bitince hangi sayfanın tazeleneceği. Kullanıcı bulunduğu
 * yerde kalıyor.
 */
export function NoteWordButton({
  surface,
  source,
  anchorId,
  snippet,
  back,
  noted = false,
  compact = false,
}: {
  surface: string;
  source: "task" | "suggestion" | "entry";
  anchorId: string;
  snippet?: string;
  back: string;
  noted?: boolean;
  compact?: boolean;
}) {
  return (
    <form action={noteWordAction} className="note-form">
      <input type="hidden" name="surface" value={surface} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="anchorId" value={anchorId} />
      {snippet ? <input type="hidden" name="snippet" value={snippet} /> : null}
      <input type="hidden" name="back" value={back} />
      <button
        className={noted ? "note-btn is-on" : "note-btn"}
        type="submit"
        title={
          noted
            ? `"${surface}" defterinde — tekrar basınca tazelenir`
            : `"${surface}" kelimesini deftere al`
        }
      >
        {compact ? (
          <>
            <span aria-hidden="true">{noted ? "✓" : "+"}</span>
            <span className="note-word" lang="en">
              {surface}
            </span>
          </>
        ) : (
          <>{noted ? "✓ defterde" : "+ deftere al"}</>
        )}
      </button>
    </form>
  );
}
