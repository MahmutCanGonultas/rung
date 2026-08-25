import type { CSSProperties } from "react";

import { BAND_ORDER } from "../../lib/k0/bands";
import { estimateLevel } from "../../lib/k3/estimate";
import { showcaseAnalysis } from "../../lib/showcase-run";

/*
 * Merdiven — logonun kendisi, gerçek üç boyutta.
 *
 * "Rung" İngilizcede merdiven basamağı demek ve ürün seviye ölçüyor. Marka
 * işareti beş basamak çiziyor; burada aynı beş basamak sayfanın en büyük
 * nesnesi. Yeni bir metafor icat edilmiyor, var olan büyütülüyor.
 *
 * ÜÇ BOYUT SAHİCİ. İlk sürüm izometrik SVG'ydi — üç boyutlu GÖRÜNEN düz bir
 * çizim. Burada her basamak `transform-style: preserve-3d` ile kurulmuş, beş
 * yüzü olan gerçek bir kutu; sahnenin `perspective`i var ve model kendi
 * ekseninde dönüyor. Örtüşmeyi boyama sırası değil tarayıcının kendi derinlik
 * hesabı çözüyor: model döndükçe yüzler doğru sırayla birbirinin önüne geçiyor,
 * uzak basamak yakınının arkasında kalıyor. WebGL yok, kütüphane yok — yirmi
 * beş `div` ve yüz başına bir renk.
 *
 * BASAMAK SAYISI VERİDEN: `BAND_ORDER` neyse o. Ölçeğe C2 eklenirse merdivene
 * basamak eklenir; burada sabit yazılmış bir "5" yok.
 *
 * YANAN BASAMAK ÖLÇÜM: aşağıdaki "Aynı motor, iki cümle" bölümündeki bozuk
 * cümle, sayfa çizilirken `estimateLevel`den geçiyor ve çıkan bant yanıyor.
 * Merdiven ikon değil, o cümlenin ölçüldüğü yeri gösteren bir okuma — ve
 * okuduğu cümle 600px aşağıda, kontrol edilebilir yerde duruyor.
 */
export function Stair() {
  const run = showcaseAnalysis("broken");
  const level = estimateLevel(
    run.text,
    run.findings.map((f) => f.subcategory)
  );
  const lit = BAND_ORDER.indexOf(level.level as (typeof BAND_ORDER)[number]);

  return (
    <div className="model">
      <div
        className="model-stage"
        role="img"
        aria-label={
          `Rung'un seviye ölçeği üç boyutlu beş basamak olarak: ` +
          `${BAND_ORDER.join(", ")}. Aşağıdaki örnek cümle ` +
          `${level.level} ölçüldü, o basamak yanıyor.`
        }
      >
        {BAND_ORDER.map((band, i) => (
          <div
            key={band}
            className={i === lit ? "mstep is-lit" : "mstep"}
            style={{ "--n": String(i) } as CSSProperties}
          >
            {/*
              Yüzler tek tek yazılı, çünkü her birinin kendi ışığı var: üst yüz
              en açık, ön yüz orta, yan ve arka en koyu. Sıra iki temada da
              korunuyor — jetonlar tema başına tanımlı.
            */}
            <div className="mbox">
              <i className="f-back" />
              <i className="f-left" />
              <i className="f-right" />
              <i className="f-top" />
              {/* Etiket ön yüze BASILI: modelin parçası, yanında duran yazı değil. */}
              <span className="f-front">{band}</span>
            </div>
          </div>
        ))}
      </div>

      {/*
        Şerh olmadan merdiven bir ikon olurdu. Bu satır onu OKUMAYA çeviriyor.
      */}
      <p className="model-read">
        Aşağıdaki cümle <b>{level.level}</b> ölçüldü
      </p>
    </div>
  );
}
