import type { CSSProperties } from "react";

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
  const worst = [...run.levels].sort((a, b) => a.recall - b.recall)[0];

  return (
    <div className="proof">
      <div className="proof-grid">
        {/*
          Hücrenin altındaki çubuk oranın KENDİSİ: %4,9 yanlış alarm gerçekten
          hücrenin %4,9'unu kaplıyor. Sayıyı sıfırdan yukarı saydıran bir sayaç
          YOK — o, yarım saniye boyunca ekranda ölçülmemiş sayı göstermek olurdu
          ve bu ürünün tek cümlelik kimliği tam olarak onu yapmamak.
        */}
        <div className="proof-cell is-lead" style={{ "--i": "0" } as CSSProperties}>
          <span className="proof-label">Yanlış alarm</span>
          <span className="proof-value">{pct(falseAlarm)}</span>
          <span className="proof-note">ana ölçüt</span>
          <i
            className="proof-fill"
            aria-hidden="true"
            style={{ "--v": String(falseAlarm) } as CSSProperties}
          />
        </div>
        <div className="proof-cell" style={{ "--i": "1" } as CSSProperties}>
          <span className="proof-label">Yakalama</span>
          <span className="proof-value">{pct(recall)}</span>
          <span className="proof-note">{run.expected} beklenen hata</span>
          <i
            className="proof-fill"
            aria-hidden="true"
            style={{ "--v": String(recall) } as CSSProperties}
          />
        </div>
        <div className="proof-cell" style={{ "--i": "2" } as CSSProperties}>
          <span className="proof-label">İsabet</span>
          <span className="proof-value">{pct(precision)}</span>
          <span className="proof-note">{run.found} bulgu</span>
          <i
            className="proof-fill"
            aria-hidden="true"
            style={{ "--v": String(precision) } as CSSProperties}
          />
        </div>
        {/*
          Burada eskiden kayıt başı dolar maliyeti vardı. Ziyaretçinin ilgisini
          çeken şey o değil; sayının neye dayandığı. Altın kümenin boyutu
          diğer üç sayının anlamını veriyor: %95 neyin üstünde ölçülmüş?
        */}
        {/* Altın küme bir SAYI, oran değil — paydası olmayan şeye orantılı
            çubuk çizilmiyor. */}
        <div className="proof-cell" style={{ "--i": "3" } as CSSProperties}>
          <span className="proof-label">Altın küme</span>
          <span className="proof-value">{run.items}</span>
          <span className="proof-note">örnek metin</span>
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
