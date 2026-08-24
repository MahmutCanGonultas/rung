import { recentRuns } from "../../lib/eval/runs";

/*
 * Ölçülen doğruluk — vitrinin en önemli parçası.
 *
 * Sayılar SABİT DEĞİL: en son ölçüm koşumundan okunuyor. Yani `npm run eval`
 * çalıştığında bu sayfa da güncelleniyor. Bir ürünün "doğruluğumu ölçüyorum"
 * demesi ile ölçtüğü sayıyı ön sayfada göstermesi arasındaki fark bu.
 *
 * Hiç koşum yoksa bölüm çizilmiyor — uydurma sayı göstermektense hiç
 * göstermemek doğru.
 */

const pct = (x: number) => `%${(x * 100).toFixed(1).replace(".", ",")}`;

export async function Proof({ compact = false }: { compact?: boolean } = {}) {
  let run;
  try {
    [run] = await recentRuns(1);
  } catch {
    return null;
  }
  if (!run) return null;

  const precision = run.found === 0 ? 1 : run.truePositive / run.found;
  const recall = run.expected === 0 ? 1 : (run.expected - run.falseNegative) / run.expected;
  const falseAlarm = run.found === 0 ? 0 : run.falsePositive / run.found;
  const perItem = run.costUsd === null ? null : run.costUsd / Math.max(run.items, 1);

  const worst = [...run.levels].sort((a, b) => a.recall - b.recall)[0];

  return (
    <div className="proof">
      <div className="proof-grid">
        <div className="proof-cell is-lead">
          <span className="proof-label">Yanlış alarm</span>
          <span className="proof-value">{pct(falseAlarm)}</span>
          <span className="proof-note">ana ölçüt</span>
        </div>
        <div className="proof-cell">
          <span className="proof-label">Yakalama</span>
          <span className="proof-value">{pct(recall)}</span>
          <span className="proof-note">{run.expected} beklenen hata</span>
        </div>
        <div className="proof-cell">
          <span className="proof-label">İsabet</span>
          <span className="proof-value">{pct(precision)}</span>
          <span className="proof-note">{run.found} bulgu</span>
        </div>
        <div className="proof-cell">
          <span className="proof-label">Kayıt başı</span>
          <span className="proof-value">
            {perItem === null ? "—" : `$${perItem.toFixed(4)}`}
          </span>
          <span className="proof-note">{run.modelId}</span>
        </div>
      </div>

      {/*
        Zayıf yeri ön sayfada söylemek bilinçli. Plan §08: "Zayıf yer
        gizlenmez." Ortalamanın arkasına saklanan bir sayı, ölçüm değil reklam.
      */}
      {worst && worst.recall < 0.9 ? (
        <p className="proof-weak">
          <b>Zayıf yer gizlenmiyor:</b> {worst.level} seviyesinde yakalama{" "}
          {pct(worst.recall)}.
          {compact ? "" : " Nüans hataları modeller için gerçekten zor."}
        </p>
      ) : null}

      {compact ? null : (
        <p className="proof-source">
          {run.items} örneklik altın kümede ölçüldü · prompt {run.promptVersion} ·
          çaba {run.effort} · {run.layers}
        </p>
      )}
    </div>
  );
}
