import { pct } from "../../lib/eval/format";
import { recentRuns } from "../../lib/eval/runs";

/*
 * Ana ölçütün sayısı — tek rakam, tek satır.
 *
 * Kahramanda eskiden 41 çentiklik bir alan vardı; ölçüt doğruydu ama sağ sütun
 * kalabalıklaşmıştı. Sayı kaldı, alan gitti: iddiayı söyleyen cümlenin sonuna
 * ekleniyor.
 *
 * Koşum okunamazsa HİÇBİR ŞEY dönmüyor. Cümle sayısız da doğru bir cümle;
 * uydurma bir sayıyla doğru olmaz.
 */
export async function FalseAlarm() {
  let run;
  try {
    [run] = await recentRuns(1);
  } catch {
    return null;
  }
  if (!run || run.found <= 0) return null;

  return (
    <span className="claim-figure">
      {pct(run.falsePositive / run.found)}
      {/* Ayraç metnin kendisinde: CSS boşluğu iki sayıyı ayırmaya yetmiyor,
          ekran okuyucu da tek sayı gibi okuyordu. */}
      <i>
        &middot; {run.found} bulgunun {run.falsePositive}&rsquo;si
      </i>
    </span>
  );
}
