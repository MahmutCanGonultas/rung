import { AnalyzeButton } from "./AnalyzeButton";
import { FindingCard } from "./FindingCard";
import { analyzeEntryAction } from "../lib/analysis-actions";
import type { StoredAnalysis, StoredFinding } from "../lib/analyses";
import { partitionFindings } from "../lib/k2/display";

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

  // Ayırma mantığı `k2/display.ts`'te ve testli — ürünün en kritik kuralı.
  const { visible, counted, suspect, filtered } = partitionFindings(findings);

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
      ) : visible.length === 0 ? (
        <p className="k1-empty">
          {filtered > 0
            ? `Model ${filtered} aday bulgu üretti, ikinci geçiş hepsini eledi. Metin bu seviyede temiz.`
            : "Model de bir şey bulamadı. Metin bu seviyede temiz görünüyor."}
        </p>
      ) : (
        <>
          <p className="k1-tally">
            <b>{counted}</b> hata
            {suspect > 0 ? (
              <>
                {" · "}
                <b>{suspect}</b> şüpheli <span>(istatistiğe girmiyor)</span>
              </>
            ) : null}
            {filtered > 0 ? (
              <>
                {" · "}
                <b>{filtered}</b> aday <span>ikinci geçişte elendi</span>
              </>
            ) : null}
          </p>

          {visible.map((finding, i) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              entryId={entryId}
              index={i}
            />
          ))}
        </>
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
