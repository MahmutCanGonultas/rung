import type { StoredFinding } from "../lib/analyses";
import { recordFeedbackAction } from "../lib/feedback-actions";
import { labelOf } from "../lib/taxonomy";

/*
 * Tek bir model bulgusunun kartı.
 *
 * İkinci geçişin kararı görünür durumda:
 *   confirmed → normal bulgu
 *   uncertain → ŞÜPHELİ · gösteriliyor ama istatistiğe girmiyor
 *   null      → doğrulanmadı (ikinci geçiş patlamış)
 *   rejected  → bu kart hiç çizilmiyor, çağıran süzüyor
 *
 * "Katılmıyorum" düğmesi süs değil: bastığın her düğme altın kümeye bir
 * yanlış alarm örneği ekliyor. Sistem kendi doğruluğunu böyle ölçüyor.
 */

function statusOf(finding: StoredFinding): {
  className: string;
  badge: string | null;
  note: string | null;
} {
  if (finding.verdict === "uncertain") {
    return {
      className: "finding is-suspect",
      badge: "şüpheli",
      note: "İkinci geçiş doğrulamadı. Gösteriliyor ama ne hata sayılıyor ne yanlış alarm.",
    };
  }
  if (finding.verdict === null) {
    return {
      className: "finding is-model is-unverified",
      badge: "doğrulanmadı",
      note: "İkinci geçiş çalıştırılamadı — bu bulgu henüz kontrol edilmedi.",
    };
  }
  return { className: "finding is-model", badge: null, note: null };
}

export function FindingCard({
  finding,
  entryId,
  index,
}: {
  finding: StoredFinding;
  entryId: string;
  index: number;
}) {
  const status = statusOf(finding);

  return (
    <div className={status.className}>
      <div className="finding-kind">
        <span className="finding-no">{index + 1}</span>
        {labelOf(finding.subcategory)}
        {status.badge ? (
          <span className="finding-badge">{status.badge}</span>
        ) : null}
        <span className="finding-conf">
          güven {finding.confidence.toFixed(2)}
        </span>
      </div>

      <div className="finding-fix">
        <span className="was">{finding.original}</span>
        {finding.suggestion ? (
          <>
            <span className="arrow">→</span>
            <span className="now">{finding.suggestion}</span>
          </>
        ) : null}
      </div>

      <p className="finding-why">{finding.explanation}</p>
      {status.note ? <p className="finding-note">{status.note}</p> : null}

      <div className="finding-actions">
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

        {finding.agreed === false ? (
          <span className="finding-thanks">
            İtirazın kaydedildi — ölçüm kümesine giriyor.
          </span>
        ) : null}
      </div>
    </div>
  );
}
