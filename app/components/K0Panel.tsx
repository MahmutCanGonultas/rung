import { analyze } from "../lib/k0";
import { segment } from "../lib/k0/segments";
import { labelOf } from "../lib/taxonomy";

/*
 * K0 şeridi ve bulgular.
 *
 * Sunucu bileşeni — analiz sunucuda çalışıyor, tarayıcıya sadece sonucu
 * gösteren HTML iniyor. Sözlük (~1 MB) hiçbir zaman inmiyor.
 *
 * Bu katmanda model yok: aynı metin her açılışta aynı sonucu veriyor, o yüzden
 * sonucu veritabanında saklamaya da gerek yok. Model katmanı geldiğinde
 * (Aşama 04) durum değişecek — orada sonuç sürümüyle birlikte kaydedilecek.
 */

function pct(x: number): string {
  return `%${Math.round(x * 100)}`;
}

/*
 * Sadece boşluktan oluşan bir "hatalı metin" ekranda hiç görünmüyor —
 * noktalamadan önceki fazla boşluk bulgusunda tam olarak bu oluyordu.
 * Boşlukları görünür bir işaretle gösteriyoruz.
 */
function visible(text: string): string {
  return text.replace(/ /g, "␣").replace(/\n/g, "⏎");
}

function num(x: number, digits = 1): string {
  return x.toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function K0Panel({ text }: { text: string }) {
  const result = analyze(text);
  const { metrics, bands, findings } = result;
  const parts = segment(text, findings);

  return (
    <>
      <div className="k0">
        <span className="k0-tag">K0 · deterministik</span>
        <span className="k0-m">
          <b>{metrics.wordCount}</b> kelime · <b>{metrics.sentenceCount}</b> cümle
        </span>
        <span className="k0-sep">│</span>
        <span className="k0-m">
          ort. <b>{num(metrics.avgSentenceLength)}</b> kelime
        </span>
        <span className="k0-sep">│</span>
        <span className="k0-m">
          yan cümle <b>{num(metrics.subordinationRatio, 2)}</b>
        </span>
        <span className="k0-sep">│</span>
        <span className="k0-m">
          çeşitlilik{" "}
          <b>
            {metrics.movingAverageTTR === null
              ? "—"
              : num(metrics.movingAverageTTR, 2)}
          </b>
        </span>
        <span className="k0-sep">│</span>
        <span className="k0-m">
          100 kelimede <b>{num(result.findingsPer100Words)}</b> bulgu
        </span>
      </div>

      {!metrics.reliable ? (
        <p className="k0-warn">
          Metin kısa — oranlar oynak. Kırk kelimenin üstünde ölçüm oturuyor.
        </p>
      ) : null}

      <article className="entry-body">
        {parts.map((part, i) =>
          part.kind === "plain" ? (
            <span key={i}>{part.text}</span>
          ) : (
            <mark key={i} className="mark-finding">
              {part.text}
              <sup>{part.index + 1}</sup>
            </mark>
          )
        )}
      </article>

      <div className="bands">
        <div className="bands-head">Kelime bandı dağılımı · farklı kelimeler</div>
        <div className="bands-bar" role="img" aria-label="Kelime bandı dağılımı">
          {(["A1", "A2", "B1", "B2", "C1"] as const).map((band) =>
            bands.counts[band] === 0 ? null : (
              <span
                key={band}
                className={`bands-slice band-${band}`}
                style={{ width: `${bands.shares[band] * 100}%` }}
                title={`${band}: ${bands.counts[band]} kelime`}
              />
            )
          )}
        </div>
        <div className="bands-legend">
          {(["A1", "A2", "B1", "B2", "C1"] as const).map((band) => (
            <span key={band} className="bands-item">
              <i className={`bands-dot band-${band}`} />
              {band} <b>{bands.counts[band]}</b>
            </span>
          ))}
          <span className="bands-item bands-above">
            temel bandın üstü <b>{pct(bands.aboveBasic)}</b>
          </span>
        </div>
      </div>

      <div className="findings">
        <div className="findings-head">
          Bulgular · {findings.length === 0 ? "yok" : `${findings.length} tane`}
        </div>

        {findings.length === 0 ? (
          <p className="empty">
            Deterministik katman bir şey bulamadı. Bu &quot;hatasız&quot; demek
            değil — yazım, temel kurallar ve sabit kalıplar temiz demek. Yorum
            gerektiren hatalar model katmanının işi.
          </p>
        ) : (
          findings.map((finding, i) => (
            <div key={`${finding.start}-${i}`} className="finding">
              <div className="finding-kind">
                <span className="finding-no">{i + 1}</span>
                {labelOf(finding.subcategory)}
                <span className="finding-conf">
                  güven {num(finding.confidence, 2)}
                </span>
              </div>
              <div className="finding-fix">
                <span className="was">{visible(finding.original)}</span>
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
      </div>
    </>
  );
}
