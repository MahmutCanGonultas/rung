import { BAND_ORDER } from "../lib/k0/bands";
import type { Level } from "../lib/content-types";

/*
 * Seviye cetveli — markanın merdiveni, mobilya olmuş hâli.
 *
 * Rung'un işareti beş basamak çiziyor ve ürünün ölçtüğü şey tam olarak o beş
 * bant. Bugüne kadar bu ölçek yalnızca vitrinde (üç boyutlu model) ve
 * "İlerleme" ekranında görünüyordu; giriş yapmış kişi "şu an neredeyim"
 * sorusunun cevabını görmek için ayrı bir ekrana gitmek zorundaydı.
 *
 * Burada beş basamak kabuğun çubuğunda, her sayfada, ölçülen bant yanıyor.
 * Yer kaplamıyor, tıklanacak bir şey değil, bir ölçüm aletinin üstündeki
 * kadran gibi sadece DURUYOR.
 *
 * Ölçülen bant renkle DEĞİL, hem renk hem ağırlık hem de bir işaretle
 * ayrılıyor: zorlanmış renklerde (forced-colors) renk düşünce ayrım kalsın.
 */
export function LevelRule({ level }: { level: Level }) {
  return (
    <p className="rule">
      <span className="rule-label">ölçülen seviyen</span>
      <span className="rule-steps">
        {BAND_ORDER.map((band) => (
          <span
            key={band}
            className={band === level ? "rule-step is-on" : "rule-step"}
            aria-hidden={band === level ? undefined : "true"}
          >
            {band}
          </span>
        ))}
      </span>
    </p>
  );
}
