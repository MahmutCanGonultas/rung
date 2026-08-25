import type { CSSProperties } from "react";

import { BAND_ORDER } from "../../lib/k0/bands";
import { estimateLevel } from "../../lib/k3/estimate";
import { showcaseAnalysis } from "../../lib/showcase-run";

/*
 * Merdiven — logonun kendisi, ürün ölçeğinde.
 *
 * "Rung" İngilizcede merdiven basamağı demek ve ürün seviye ölçüyor. Marka
 * işareti beş basamak çiziyor; burada aynı beş basamak sayfanın en büyük
 * nesnesi oluyor. Yeni bir metafor icat edilmiyor, var olanı büyütülüyor.
 *
 * BASAMAK SAYISI VERİDEN: `BAND_ORDER` neyse o. Ölçeğe C2 eklenirse merdivene
 * basamak eklenir; burada sabit yazılmış bir "5" yok.
 *
 * YANAN BASAMAK ÖLÇÜM: aşağıdaki "Aynı motor, iki cümle" bölümündeki bozuk
 * cümle, sayfa çizilirken `estimateLevel`den geçiyor ve çıkan bant yanıyor.
 * Yani merdiven bir ikon değil, o cümlenin ölçüldüğü yeri gösteren bir okuma —
 * ve okuduğu cümle 600px aşağıda, kontrol edilebilir yerde duruyor.
 *
 * Hacim SVG'de izometrik: her basamak üç yüzü olan bir kutu (ön, üst, sağ).
 * Boyama sırası 0'dan 4'e, yani her basamak bir öncekinin sağ yüzünü kapatıyor
 * — gerçek 3B'deki örtüşmenin ta kendisi. WebGL yok, kütüphane yok, üç yüz
 * rengi var.
 */

/** Basamak eni, yüksekliği; ve derinliğin ekrandaki iki bileşeni. */
const W = 76;
const H = 52;
const DX = 40;
/** 30°'lik izometri: tan(30°) ≈ 0,577. */
const DY = Math.round(DX * 0.577);

const N = BAND_ORDER.length;
const BASE = N * H;
const VW = N * W + DX;
const VH = BASE + DY;

const pts = (...p: Array<[number, number]>) => p.map(([x, y]) => `${x},${y}`).join(" ");

export function Stair() {
  const run = showcaseAnalysis("broken");
  const level = estimateLevel(
    run.text,
    run.findings.map((f) => f.subcategory)
  );
  const lit = BAND_ORDER.indexOf(level.level as (typeof BAND_ORDER)[number]);

  return (
    <div className="stair">
      <svg
        className="stair-art"
        viewBox={`0 0 ${VW} ${VH + 26}`}
        role="img"
        aria-label={
          `Rung'un seviye ölçeği beş basamak olarak: ` +
          `${BAND_ORDER.join(", ")}. Aşağıdaki örnek cümle ` +
          `${level.level} ölçüldü, o basamak yanıyor.`
        }
        focusable="false"
      >
        {BAND_ORDER.map((band, i) => {
          const x0 = i * W;
          const x1 = x0 + W;
          const top = BASE - (i + 1) * H + DY;
          const bottom = BASE + DY;
          const isLit = i === lit;

          return (
            <g
              key={band}
              className={isLit ? "stair-step is-lit" : "stair-step"}
              style={{ "--i": String(i) } as CSSProperties}
            >
              {/* sağ yüz — bir sonraki basamak bunu kapatıyor, sonuncusu hariç */}
              <polygon
                className="stair-side"
                points={pts(
                  [x1, top],
                  [x1 + DX, top - DY],
                  [x1 + DX, bottom - DY],
                  [x1, bottom]
                )}
              />
              {/* üst yüz — basamağın basılan yeri */}
              <polygon
                className="stair-tread"
                points={pts(
                  [x0, top],
                  [x1, top],
                  [x1 + DX, top - DY],
                  [x0 + DX, top - DY]
                )}
              />
              {/* ön yüz */}
              <polygon
                className="stair-riser"
                points={pts([x0, top], [x1, top], [x1, bottom], [x0, bottom])}
              />
            </g>
          );
        })}

        {/*
          Etiketler hareket eden gruptan DIŞARIDA. İçeride olsalardı basamak
          tabandan yükselirken `scaleY` yazıyı da ezerdi.
        */}
        {BAND_ORDER.map((band, i) => (
          <text
            key={`t-${band}`}
            className={i === lit ? "stair-label is-lit" : "stair-label"}
            x={i * W + W / 2}
            y={BASE + DY + 20}
          >
            {band}
          </text>
        ))}
      </svg>

      {/*
        Şerh olmadan merdiven bir ikon olurdu. Bu satır onu OKUMAYA çeviriyor
        ve okuduğu şey aşağıda, kontrol edilebilir yerde duruyor.
      */}
      <p className="stair-note">
        Aşağıdaki cümle <b>{level.level}</b> ölçüldü
      </p>
    </div>
  );
}
