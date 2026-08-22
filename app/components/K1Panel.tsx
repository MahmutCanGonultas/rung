import { AnalyzeButton } from "./AnalyzeButton";
import { analyzeEntryAction } from "../lib/analysis-actions";
import type { StoredAnalysis, StoredFinding } from "../lib/analyses";
import { labelOf } from "../lib/taxonomy";

/*
 * K1 — model katmanının çıktısı.
 *
 * K0 panelinden ayrı duruyor ve ayrı görünüyor: kullanıcı hangi bulgunun
 * deterministik, hangisinin model çıkarımı olduğunu bilmeli. Plan §04'ün
 * temel iddiası bu ayrımın görünür olması.
 */

function money(x: number): string {
  return `$${x.toFixed(4)}`;
}

export function K1Panel({
  entryId,
  analysis,
  findings,
}: {
  entryId: string;
  analysis: StoredAnalysis | null;
  findings: StoredFinding[];
}) {
  const label = analysis ? "Yeniden analiz et" : "Modele sor";

  return (
    <section className="k1">
      <div className="k1-head">
        <span className="k1-tag">K1 · model çıkarımı</span>

        {analysis?.status === "ok" ? (
          <span className="k1-meta">
            {analysis.modelId} · prompt {analysis.promptVersion}
            {analysis.costUsd !== null ? ` · ${money(analysis.costUsd)}` : ""}
            {analysis.durationMs !== null ? ` · ${analysis.durationMs} ms` : ""}
          </span>
        ) : null}
      </div>

      {analysis === null ? (
        <p className="k1-empty">
          Bu kayıt henüz modele sorulmadı. Deterministik katman yorum
          gerektiren hataları (zaman, ton, eşdizim, doğal olmayan kalıp)
          bulamaz — onlar bu adımda çıkıyor.
        </p>
      ) : analysis.status === "failed" ? (
        <p className="form-error" role="alert">
          Son deneme başarısız oldu: {analysis.error}
        </p>
      ) : findings.length === 0 ? (
        <p className="k1-empty">
          Model de bir şey bulamadı. Metin bu seviyede temiz görünüyor.
        </p>
      ) : (
        findings.map((finding, i) => (
          <div key={finding.id} className="finding is-model">
            <div className="finding-kind">
              <span className="finding-no">{i + 1}</span>
              {labelOf(finding.subcategory)}
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
          </div>
        ))
      )}

      {analysis?.status === "ok" && analysis.error ? (
        <p className="k1-note">
          Doğrulama katmanı bazı bulguları eledi — metinde yeri bulunamayan ya
          da taksonomi dışı olanlar kullanıcıya hiç gösterilmiyor.
        </p>
      ) : null}

      <AnalyzeButton action={analyzeEntryAction} entryId={entryId} label={label} />
    </section>
  );
}
