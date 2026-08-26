import type { CSSProperties } from "react";

import { BAND_ORDER } from "../../lib/k0/bands";

/*
 * Merdiven — logonun kendisi, gerçek üç boyutta.
 *
 * "Rung" İngilizcede merdiven basamağı demek ve ürün seviye ölçüyor. Marka
 * işareti beş basamak çiziyor; burada aynı beş basamak sayfanın en büyük
 * nesnesi. Yeni metafor icat edilmiyor, var olan büyütülüyor.
 *
 * ÜÇ BOYUT SAHİCİ: her basamak `transform-style: preserve-3d` ile kurulmuş beş
 * yüzlü bir kutu, sahnenin `perspective`i var, derinlik sırasını tarayıcı
 * hesaplıyor. Model dönerken yüzler doğru sırayla birbirinin önüne geçiyor.
 * WebGL yok, kütüphane yok — yirmi beş `div`, yüz başına bir renk.
 *
 * BASAMAK SAYISI VE ETİKETLER VERİDEN: `BAND_ORDER` neyse o. Ölçeğe C2
 * eklenirse merdivene basamak ve ölçeğe etiket eklenir; burada sabit yazılmış
 * bir "5" yok. Nesne bir ölçüm göstermiyor, ÖLÇEĞİN KENDİSİ — o yüzden üstünde
 * bir sayı da yok, dönerken değişebilecek bir şey de.
 *
 * Işık basamaklarda dolaşıyor, birinde durmuyor. Önceki sürümde A2 sabit
 * yanıyordu (o sayfadaki örnek cümlenin ölçülen bandı); ürün sahibi ışığın
 * takılı kalmasını istemedi. Ölçüm bilgisi kaybolmadı — aynı cümlenin bandı
 * "Aynı motor, iki cümle" bölümünde, bulgularıyla birlikte duruyor.
 */
export function Stair({ lit = "climb" }: { lit?: "climb" | number }) {
  /*
   * İKİ DAVRANIŞ, TEK NESNE.
   *
   * `climb` — ışık A1'den C1'e yürüyor ve hiçbirinde durmuyor. Anasayfa böyle
   * kullanıyor: orada merdiven bir VAAT, aylar boyunca yukarı.
   *
   * bir sayı — o basamak sabit yanıyor. Kapı ekranı böyle kullanıyor: orada
   * merdiven bir OKUMA, aşağıdaki cümlenin ölçüldüğü yeri gösteriyor.
   */
  const sabit = typeof lit === "number";
  return (
    <div className={sabit ? "model is-fixed" : "model"}>
      <div
        className="model-stage"
        role="img"
        aria-label={
          `Rung'un seviye ölçeği üç boyutlu bir merdiven olarak: ` +
          `${BAND_ORDER.join(", ")}. En alt basamak A1, en üst basamak C1.` +
          (sabit ? ` Ölçülen basamak: ${BAND_ORDER[lit]}.` : "")
        }
      >
        {/* Zemin teması: model havada durmasın. Bulanıklık `filter` ile
            DEĞİL radyal gradyanla — `filter` `preserve-3d`yi düzleştiriyor. */}
        <i className="model-ground" />

        {BAND_ORDER.map((band, i) => (
          <div
            key={band}
            className={sabit && i === lit ? "mstep is-lit" : "mstep"}
            style={{ "--n": String(i) } as CSSProperties}
          >
            {/*
              Beş yüz, her birinin kendi ışığı: üst en açık, ön orta, yan ve
              arka en koyu. Sıra iki temada da korunuyor.
            */}
            <div className="mbox">
              <i className="f-back" />
              <i className="f-left" />
              <i className="f-right" />
              <i className="f-top" />
              <i className="f-front" />
            </div>
          </div>
        ))}
      </div>

      {/*
        Etiketler modelin DIŞINDA. Riser'lara basılıyken 10px'e sıkışıyor,
        eğik yüzeyde okunması zorlaşıyor ve modeli kalabalıklaştırıyorlardı.
        Burada düz bir ölçek satırı: okunur, sakin, ve basamaklarla aynı
        ritimde yanıyor.
      */}
      <p className="model-scale" aria-hidden="true">
        {BAND_ORDER.map((band, i) => (
          <span
            key={band}
            className={sabit && i === lit ? "is-lit" : undefined}
            style={{ "--n": String(i) } as CSSProperties}
          >
            {band}
          </span>
        ))}
      </p>
    </div>
  );
}
