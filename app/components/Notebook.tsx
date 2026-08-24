import Link from "next/link";

import type { WordNote } from "../lib/vocab/notes";
import { resolveNoteAction } from "../lib/vocab/note-actions";

/*
 * Kelime defteri — "sonra bakarım" listesinin durduğu yer.
 *
 * NE OLMADIĞI önemli: bu liste Rung'ın "şu kelimeleri bilmiyorsun" ölçümü
 * DEĞİL. Öyle bir ölçüm yapılmıyor ve yapılıyormuş gibi göstermek, bu ürünün
 * hiç yapmadığı şey. Liste tamamen kullanıcının kendi işaretlediklerinden
 * oluşuyor; başlığın altındaki cümle bunu açıkça söylüyor.
 *
 * Hiç not yoksa bölüm HİÇ çizilmiyor — sıfır göstermiyor. Sıfır, "bir şey
 * ölçtük ve sonuç sıfır çıktı" demek; burada ölçülen bir şey yok.
 */

const DAY = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Istanbul",
});

const SOURCE: Record<WordNote["source"], string> = {
  task: "görev metninde",
  suggestion: "Rung'ın önerisinde",
  entry: "kendi yazında",
};

export function Notebook({
  notes,
  open,
  resolved,
}: {
  notes: WordNote[];
  open: number;
  resolved: number;
}) {
  if (notes.length === 0) return null;

  return (
    <>
      <div className="month">
        <span>
          Kelime defteri · {open} açık
          {resolved > 0 ? ` · ${resolved} kapattın` : ""}
        </span>
        <span>senin işaretlediklerin</span>
      </div>

      <p className="note-lede">
        Bu liste <b>senin işaretlediğin</b> kelimeler. Rung &quot;bunu
        bilmiyorsun&quot; diye bir ölçüm yapmıyor — hangi kelimeye takıldığını
        yalnızca sen bilirsin.
      </p>

      <div className="notes">
        {notes.map((note) => (
          <div
            key={note.id}
            className={note.resolved ? "note is-done" : "note"}
          >
            <div className="note-main">
              <span className="note-head">
                <span className="note-term" lang="en">
                  {note.surface}
                </span>
                <span className={`note-band band-${note.band}`}>
                  {note.band === "C1" ? "listede yok" : note.band}
                </span>
              </span>

              {note.contextSnippet ? (
                <span className="note-ctx" lang="en">
                  {note.contextSnippet}
                </span>
              ) : null}

              <span className="note-meta">
                {DAY.format(note.notedAt)} · {SOURCE[note.source]}
                {note.entryId ? (
                  <>
                    {" · "}
                    <Link href={`/entries/${note.entryId}`}>kayda git</Link>
                  </>
                ) : null}
              </span>
            </div>

            {/*
              "Biliyorum" bir ÖLÇÜM değil, kullanıcının kendi beyanı. Etiket
              bunu söylüyor: Rung bir kelimeyi bilip bilmediğini ölçemez.
            */}
            <form action={resolveNoteAction} className="note-form">
              <input type="hidden" name="noteId" value={note.id} />
              <input type="hidden" name="open" value={note.resolved ? "1" : "0"} />
              <button className="act" type="submit">
                {note.resolved ? "geri al" : "artık biliyorum"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
