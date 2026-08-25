import type { CSSProperties } from "react";

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
 * Kadran — aletin yüzü.
 *
 * SÜS DEĞİL. Resimdeki her koordinat üründen geliyor:
 *
 *   · çevre ekseni   = taksonomi. Yirmi bir alt kategori, beş aile sektörüne
 *     kümelenmiş, çember tam kapanacak şekilde (21 + 5 × 1,4 = 28 birim).
 *   · yarıçap ekseni = A1..C1 bant ölçeği, BEŞ EŞİT ADIM. Eşit, çünkü
 *     `bandOfScore` 0–4 skoru eşit eşiklerle yuvarlıyor; eşit olmayan aralık
 *     burada yalan olurdu.
 *   · vurgu dolgusu  = `estimateLevel` HAM skoru, yuvarlanmış bant değil.
 *     Dolgu ölçülen halkanın bir tık altında duruyor, çünkü skor tam sayı
 *     değil.
 *   · yanan noktalar = bu sayfa açılırken gerçek K0'ın bulduğu bulgular,
 *     kendi kategorilerinin ışınında ve metnin ölçüldüğü halkada.
 *
 * Bir K0 kuralı değişirse takımyıldız değişir. Taksonomiye alt kategori
 * eklenirse ışın eklenir. Yani resim, ürünün o anki hâli.
 *
 * Aile SIRASI bir yerleşim kararı, veri değil: Türkçe kaynaklı aile saat
 * 12'den başlıyor çünkü alet Türkçe konuşanlar için yapıldı. Sayılar
 * yerleşimden değil `SUBCATEGORIES`ten geliyor.
 *
 * `--model` (mor) bu çizimde HİÇ YOK: o jeton "bunu bir model üretti" demek
 * ve burada model yok — K0 deterministik.
 */

const C = 230;
const R_IN = 92;
const R_OUT = 188;
const HUB = 62;
/** İki aile arasındaki ek boşluk, ışın birimi cinsinden. */
const GAP = 1.4;
const STEP = (R_OUT - R_IN) / (BAND_ORDER.length - 1);

const ORDER: Family[] = [
  "turkish",
  "grammar",
  "lexis",
  "mechanics",
  "discourse",
];

const subsOf = (family: Family) =>
  (Object.keys(SUBCATEGORIES) as Subcategory[]).filter(
    (s) => SUBCATEGORIES[s].family === family
  );

function layout() {
  const rays = new Map<Subcategory, number>();
  let cursor = 0;
  for (const family of ORDER) {
    const subs = subsOf(family);
    subs.forEach((sub, i) => rays.set(sub, cursor + i));
    cursor += subs.length + GAP;
  }
  return { rays, units: cursor };
}

const f1 = (n: number) => Number(n.toFixed(1));

export function Dial() {
  const run = showcaseAnalysis("broken");
  // Aynı metin, aynı motor: cümle şeridiyle bire bir aynı ölçüm.
  const level = estimateLevel(
    run.text,
    run.findings.map((f) => f.subcategory)
  );

  const { rays, units } = layout();
  const deg = 360 / units;
  const at = (u: number, r: number): [number, number] => {
    const a = ((-90 + u * deg) * Math.PI) / 180;
    return [f1(C + r * Math.cos(a)), f1(C + r * Math.sin(a))];
  };

  const ringR = BAND_ORDER.map((_, i) => R_IN + i * STEP);
  const levelIndex = BAND_ORDER.indexOf(
    level.level as (typeof BAND_ORDER)[number]
  );
  const readR = ringR[levelIndex];
  const scoreR = f1(
    R_IN + (level.score / (BAND_ORDER.length - 1)) * (R_OUT - R_IN)
  );

  /*
   * Bir kategoriye iki bulgu düşerse nokta bir kez yanıyor; numara ilk
   * bulgununki, yani cümledeki ilk üst simgeyle aynı.
   */
  const first = new Map<Subcategory, number>();
  run.findings.forEach((f, i) => {
    if (!first.has(f.subcategory)) first.set(f.subcategory, i);
  });
  const lit = [...first.entries()].sort((a, b) => a[1] - b[1]);

  return (
    <div className="dial">
      <svg
        className="dial-face"
        viewBox={`0 0 ${C * 2} ${C * 2}`}
        role="img"
        aria-label={
          `Rung'un ölçüm kadranı: çevrede beş aileye ayrılmış yirmi bir alt ` +
          `kategori, merkezden dışa A1'den C1'e beş seviye halkası. Bu ` +
          `sayfadaki örnek cümle ${level.level} seviyesinde ölçüldü ve ` +
          `${lit.length} kategoriye değdi.`
        }
        focusable="false"
      >
        <defs>
          <radialGradient
            id="dial-read"
            gradientUnits="userSpaceOnUse"
            cx={C}
            cy={C}
            r={scoreR}
          >
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.03" />
            <stop offset="0.62" stopColor="var(--accent)" stopOpacity="0.1" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* OKUMA: yüz, ölçülen ham skora kadar dolu. */}
        <circle cx={C} cy={C} r={scoreR} fill="url(#dial-read)" />
        <circle className="dial-read-rim" cx={C} cy={C} r={scoreR} />

        {/* Beş graduation: bant ölçeği. Ölçülen halka vurgu renginde. */}
        {ringR.map((r, i) => (
          <circle
            key={BAND_ORDER[i]}
            className={
              i === levelIndex
                ? "dial-ring is-read"
                : i === ringR.length - 1
                  ? "dial-ring is-top"
                  : "dial-ring"
            }
            cx={C}
            cy={C}
            r={r}
          />
        ))}

        {/* Yirmi bir ışın: her alt kategori bir çizgi. */}
        {[...rays.entries()].map(([sub, u]) => {
          const [x1, y1] = at(u, R_IN);
          const [x2, y2] = at(u, R_OUT);
          return (
            <line
              key={sub}
              className="dial-ray"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
            />
          );
        })}

        {/* Ölçek etiketleri: aile boşluğunun ortasında yukarı tırmanıyorlar. */}
        {ringR.map((r, i) => {
          const [x, y] = at(units - 1.2, r);
          return (
            <text
              key={`t-${BAND_ORDER[i]}`}
              className="dial-tick"
              x={x}
              y={y + 3.5}
            >
              {BAND_ORDER[i]}
            </text>
          );
        })}

        {/* Yanan bulgular: iğne + hale + nokta + numara. */}
        {lit.map(([sub, index], i) => {
          const u = rays.get(sub) ?? 0;
          const [hx, hy] = at(u, HUB + 4);
          const [nx, ny] = at(u, readR - 9);
          const [dx, dy] = at(u, readR);
          const [tx, ty] = at(u, readR + 18);
          return (
            <g
              key={sub}
              className="dial-hit"
              style={{ "--i": String(i) } as CSSProperties}
            >
              <line
                className="dial-needle"
                x1={hx}
                y1={hy}
                x2={nx}
                y2={ny}
              />
              <circle className="dial-halo" cx={dx} cy={dy} r="11" />
              <circle className="dial-dot" cx={dx} cy={dy} r="4" />
              <text className="dial-no" x={tx} y={ty + 3.5}>
                {index + 1}
              </text>
            </g>
          );
        })}

        <circle className="dial-hub" cx={C} cy={C} r={HUB} />
      </svg>

      {/* Göbek metni HTML: Türkçe tipografi ve tema, SVG <text>ten iyi. */}
      <p className="dial-centre" aria-hidden="true">
        <b className="dial-level">{level.level}</b>
        <span className="dial-score">
          {level.score.toFixed(2).replace(".", ",")} / 4 · ham skor
        </span>
      </p>
    </div>
  );
}

/** Kadranın anahtarı. Sayılar taksonomiden, sıra kadranın sırasından. */
export function DialLegend() {
  return (
    <p className="dial-legend">
      {ORDER.map((family) => (
        <span key={family}>
          {FAMILIES[family]} <b>{subsOf(family).length}</b>
        </span>
      ))}
      <i>saat 12&rsquo;den saat yönünde</i>
    </p>
  );
}
