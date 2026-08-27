import type { MergedFinding } from "../lib/findings-merge";
import { recordFeedbackAction } from "../lib/feedback-actions";
import { labelOf } from "../lib/taxonomy";
import { NoteWordButton } from "./NoteWordButton";

/*
 * TEK BULGU, TEK SATIR.
 *
 * Daha önce iki ayrı bileşen vardı: K0 bulguları `K0Panel` içinde düz bir
 * blok, K1 bulguları `FindingCard` içinde bir kart. İki farklı görünüm, iki
 * farklı başlık, iki farklı açıklama paragrafı — ve ikisi de aynı şeyi
 * anlatıyordu: "şunu şöyle yazmalıydın."
 *
 * Ayrım ürünü YAPANIN zihin haritasıydı. Yazan kişinin sorusu tek. Satır tek.
 * Katman bilgisi kaybolmadı — satırın sonunda küçük bir künye olarak duruyor,
 * çünkü hangi bulgunun kuraldan hangisinin modelden geldiğini görmek bu ürünün
 * temel iddiası. Ama artık bilgi, bölüm değil.
 *
 * KAPALI DURAN AÇIKLAMA: `<details>` yerel, klavyeyle çalışıyor, JavaScript
 * gerektirmiyor. Satırın kendisi — yanlış → doğru — hep görünür; NEDEN olduğu
 * isteyene açılıyor. Altı bulgunun altı paragrafı aynı anda açık durduğunda
 * ekran okunmuyordu.
 */

/*
 * Sadece boşluktan oluşan bir bulgu ekranda hiç görünmüyordu — noktalamadan
 * önceki fazla boşlukta tam olarak bu oluyor.
 *
 * Ama YALNIZCA o durumda: her boşluğu işaretlemek "I am agree" gibi çok
 * kelimeli bir bulguyu "I␣am␣agree" yapıyor ve okunmaz hâle getiriyordu.
 * Kural: metin görünür bir karakter taşıyor VE kenarlarında boşluk yoksa
 * olduğu gibi yazılıyor.
 */
function visible(text: string): string {
  if (text.trim().length > 0 && text.trim() === text) return text;
  return text.replace(/ /g, "␣").replace(/\n/g, "⏎");
}

/* Defter kelime tutuyor, kalıp değil: "tomorrow's meeting" deftere gitmiyor. */
const SINGLE_WORD = /^[A-Za-z][A-Za-z'’-]{1,63}$/;

function durum(finding: MergedFinding): { badge: string | null; note: string | null } {
  if (finding.layer === "K0") return { badge: null, note: null };
  if (finding.verdict === "uncertain") {
    return {
      badge: "şüpheli",
      note: "İkinci geçiş doğrulamadı. Gösteriliyor ama ne hata sayılıyor ne yanlış alarm.",
    };
  }
  if (finding.verdict === null || finding.verdict === undefined) {
    return {
      badge: "doğrulanmadı",
      note: "İkinci geçiş çalıştırılamadı — bu bulgu henüz kontrol edilmedi.",
    };
  }
  return { badge: null, note: null };
}

export function FixRow({
  finding,
  index,
  entryId,
  noted,
  open,
}: {
  finding: MergedFinding;
  /** Metindeki işaretle aynı numara — ikisi aynı sırayı okuyor. */
  index: number;
  entryId: string;
  noted: Set<string>;
  /** İlk satır açık geliyor: bir bulgunun nasıl okunacağı bir kez gösteriliyor. */
  open?: boolean;
}) {
  const { badge, note } = durum(finding);
  const word =
    finding.suggestion && SINGLE_WORD.test(finding.suggestion.trim())
      ? finding.suggestion.trim()
      : null;

  return (
    <li className="fix" id={`b${index + 1}`}>
      <details className="fix-in" open={open}>
        <summary className="fix-line">
          <span className="fix-no">{index + 1}</span>

          <span className="fix-swap" lang="en">
            <span className="fix-was">{visible(finding.original)}</span>
            {finding.suggestion ? (
              <>
                <span className="fix-arrow" aria-hidden="true">
                  →
                </span>
                <span className="fix-now">{finding.suggestion}</span>
              </>
            ) : null}
          </span>

          <span className="fix-kind">
            {labelOf(finding.subcategory)}
            {badge ? <b className="fix-badge">{badge}</b> : null}
          </span>
        </summary>

        <div className="fix-body">
          <p className="fix-why">{finding.explanation}</p>
          {note ? <p className="fix-note">{note}</p> : null}

          <div className="fix-foot">
            {/*
              Künye: bu bulguyu ne üretti. Kural mı, model mi — ürünün en
              temel iddiası bunun görünür olması.
            */}
            <span className="fix-src">
              {finding.layer === "K0" ? "kural" : "model"} · güven{" "}
              {finding.confidence.toFixed(2)}
            </span>

            {/*
              Geri bildirim yalnızca MODEL bulgularında. "Katılmıyorum" süs
              değil: bastığın her düğme altın kümeye bir yanlış alarm örneği
              ekliyor ve sistem kendi doğruluğunu böyle ölçüyor. Deterministik
              bulgu için itiraz kutusu yok — orada tartışılacak bir yorum yok,
              kural ya işlemiş ya işlememiş.
            */}
            {finding.id ? (
              <>
                <form action={recordFeedbackAction}>
                  <input type="hidden" name="findingId" value={finding.id} />
                  <input type="hidden" name="entryId" value={entryId} />
                  <input type="hidden" name="agreed" value="1" />
                  <button
                    className={finding.agreed === true ? "act is-on" : "act"}
                    type="submit"
                  >
                    Anladım
                  </button>
                </form>

                <form action={recordFeedbackAction}>
                  <input type="hidden" name="findingId" value={finding.id} />
                  <input type="hidden" name="entryId" value={entryId} />
                  <input type="hidden" name="agreed" value="0" />
                  <button
                    className={finding.agreed === false ? "act is-off" : "act"}
                    type="submit"
                  >
                    Katılmıyorum
                  </button>
                </form>
              </>
            ) : null}

            {word ? (
              <NoteWordButton
                surface={word}
                source="suggestion"
                anchorId={finding.id ?? `k0-${index}`}
                back={`/entries/${entryId}`}
                noted={noted.has(word.toLowerCase())}
                compact
              />
            ) : null}

            {finding.agreed === false ? (
              <span className="fix-thanks">
                İtirazın kaydedildi — gözden geçirilip ölçüm kümesine ekleniyor.
              </span>
            ) : null}
          </div>
        </div>
      </details>
    </li>
  );
}
