import { BAND_ORDER } from "../../lib/k0/bands";
import { estimateLevel } from "../../lib/k3/estimate";
import { showcaseAnalysis } from "../../lib/showcase-run";
import {
  FAMILIES,
  SUBCATEGORIES,
  type Family,
  type Subcategory,
} from "../../lib/taxonomy";

/*
 * Kapı ekranındaki üç küçük şekil.
 *
 * Üçü de UYDURMA DEĞİL: taksonomi tek kaynaktan okunuyor, kayıt alanları
 * gerçekten saklanan alanlar, sinyaller bu sayfa açılırken hesaplanıyor.
 */

const ORDER: Family[] = [
  "turkish",
  "grammar",
  "lexis",
  "mechanics",
  "discourse",
];

/* ── 02 · sabit taksonomi ──────────────────────────────────────────── */
/*
 * Yirmi bir alt kategorinin tamamı, beş aile hâlinde. Liste elle yazılmıyor:
 * `SUBCATEGORIES`ten geliyor, yani oraya bir alt kategori eklendiğinde hem
 * burası hem kadran kendiliğinden büyüyor.
 */
export function TaxonomyChips() {
  return (
    <div className="taxo">
      {ORDER.map((family) => {
        const subs = (Object.keys(SUBCATEGORIES) as Subcategory[]).filter(
          (s) => SUBCATEGORIES[s].family === family
        );
        return (
          <div key={family} className="taxo-family">
            <p className="taxo-name">
              {FAMILIES[family]} <b>{subs.length}</b>
            </p>
            <div className="taxo-chips">
              {subs.map((sub) => (
                <span key={sub} className="taxo-chip">
                  {SUBCATEGORIES[sub].label}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 04 · değiştirilemez kayıt ─────────────────────────────────────── */
/*
 * Beş alan, beşi de gerçekten `analyses` ve `findings` tablolarında saklanan
 * sütunlar. Numune değil, alan listesi — bir eval koşumunun künyesini buraya
 * koymak "her analiz sürümüyle saklanıyor" cümlesini kanıtlamazdı.
 */
const RECORD = [
  ["metin", "yazdığın hâliyle"],
  ["bulgular", "konumuyla birlikte"],
  ["model kimliği", "hangi model buldu"],
  ["prompt version (istem sürümü)", "hangi yönergeyle"],
  ["timestamp (zaman damgası)", "ne zaman"],
] as const;

export function RecordStamp() {
  return (
    <div className="stamp">
      <p className="stamp-head">
        Kayıt <b>değiştirilemez</b>
      </p>
      <dl className="stamp-rows">
        {RECORD.map(([field, note]) => (
          <div key={field} className="stamp-row">
            <dt>{field}</dt>
            <dd>{note}</dd>
          </div>
        ))}
      </dl>
      <p className="stamp-foot">Beşi birlikte yazılıyor, beşi birlikte kalıyor.</p>
    </div>
  );
}

/* ── 05 · dört deterministik sinyal ────────────────────────────────── */
/*
 * Yukarıdaki cümlenin GERÇEK sinyalleri, kadranın göbeğindeki skoru üreten
 * dördü. Sabit yazılmadı: `estimateLevel` bu sayfa açılırken koşuyor.
 */
export function LevelSignals() {
  const run = showcaseAnalysis("broken");
  const level = estimateLevel(
    run.text,
    run.findings.map((f) => f.subcategory)
  );

  return (
    <div className="signals">
      {level.signals.map((signal) => (
        <div key={signal.name} className="signal">
          <div className="signal-top">
            <span className="signal-name">{signal.name}</span>
            <span className="signal-band">{signal.band}</span>
          </div>
          <span className="meter-track">
            <span
              className="meter-fill"
              style={{
                width: `${Math.round((signal.value / (BAND_ORDER.length - 1)) * 100)}%`,
              }}
            />
          </span>
          <span className="signal-detail">{signal.detail}</span>
        </div>
      ))}
      <p className="signal-sum">
        Dört sinyal, tek skor:{" "}
        <b>{level.score.toFixed(2).replace(".", ",")} / 4</b>. Kadranın
        göbeğinde duran sayı bu.
        {!level.reliable ? (
          <>
            {" "}
            İki cümle bir seviye ölçümü için kısa; motor bunu kendisi söylüyor
            ve tahmini oynak olarak işaretliyor. Ölçek uzun metinde de aynı
            ölçek.
          </>
        ) : null}
      </p>
    </div>
  );
}
