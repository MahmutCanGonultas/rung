import { BAND_ORDER } from "../lib/k0/bands";
import type { Level } from "../lib/content-types";

/*
 * Seviye cetveli — markanın merdiveni, mobilya olmuş hâli.
 *
 * Rung'un işareti beş basamak çiziyor ve ürünün ölçtüğü şey tam olarak o beş
 * bant. Cetvel kabuğun çubuğunda, her sayfada duruyor: "şu an neredeyim"
 * sorusunun cevabı bir ekran değil, bir satır.
 *
 * ÖLÇÜM YOKSA HİÇBİR BANT YANMIYOR.
 *
 * Önceki hâli `currentLevel()` okuyordu ve o fonksiyon ölçüm bulamayınca
 * VARSAYILANI (B1) döndürüyor. Sonuç: hiç yazmamış bir kullanıcı, açtığı ilk
 * ekranda kendi seviyesi olarak B1 görüyordu. Uydurulmuş bir sayı — üstelik
 * ürünün tek cümlelik kimliği tam olarak bunu yapmamak.
 *
 * Varsayılan seviye YOK OLMADI; yeri değişti. Görev seçimi hâlâ ondan
 * besleniyor (yeni kullanıcıya bir zorluktan başlamak gerekiyor) ama o
 * GÖREVİN zorluğu, kullanıcının ölçümü değil.
 */
export function LevelRule({ level }: { level: Level | null }) {
  return (
    <p className="rule">
      <span className="rule-label">
        {level ? "ölçülen seviyen" : "seviyen"}
      </span>
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
      {level ? null : (
        <span className="rule-none">ilk kaydından sonra ölçülüyor</span>
      )}
    </p>
  );
}
