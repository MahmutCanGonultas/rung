import type { StoredEstimate } from "../lib/k3/store";

/*
 * Seviye kartı — dört sinyal ve bir bant.
 *
 * İki yerde kullanılıyor ve ikisi AYRI ŞEYİ ölçüyor; kart hangisi olduğunu
 * yazıyor, çünkü karıştırılırsa sayı yalan söylemeye başlar:
 *
 *   pano          kullanıcının GÜNCEL seviyesi — son kayıttan
 *   kayıt sayfası O METNİN seviyesi — kaydedildiği anda ölçülen
 *
 * Dördü de deterministik katmandan geliyor: model yok, aynı metin her zaman
 * aynı tahmini veriyor. Kullanıcıya "seviyen ne" diye SORULMUYOR — plan §06
 * bunu açıkça eliyor, çünkü kendi seviyesini doğru bilen çok az kişi var.
 */
export function LevelCard({
  estimate,
  label,
  lede,
  warn,
}: {
  estimate: StoredEstimate;
  label: string;
  lede: string;
  /** Kısa metin uyarısı — iki bağlamda farklı cümle gerekiyor. */
  warn: string;
}) {
  return (
    <div className="level-card">
      <div className="level-head">
        <span className="level-label">{label}</span>
        <span className="level-value">{estimate.level}</span>
        <span className="level-score">
          skor {estimate.score.toFixed(2)} / 4
        </span>
      </div>

      <p className="level-lede">{lede}</p>

      <div className="level-signals">
        {estimate.signals.map((signal) => (
          <div key={signal.name} className="level-signal">
            <div className="level-signal-top">
              <span>{signal.name}</span>
              <b>{signal.band}</b>
            </div>
            <span className="meter-track">
              <span
                className="meter-fill"
                style={{ width: `${Math.round((signal.value / 4) * 100)}%` }}
              />
            </span>
            <span className="level-signal-detail">{signal.detail}</span>
          </div>
        ))}
      </div>

      {/*
        Güvenilmez tahmini SAKLAMIYORUZ, etiketliyoruz. Kısa metinde dört
        sinyalin de payı oynak; sayıyı gizlemek onu güvenilir yapmıyor, ne
        kadar güvenileceğini söylemek yapıyor.
      */}
      {!estimate.reliable ? <p className="level-warn">{warn}</p> : null}
    </div>
  );
}
