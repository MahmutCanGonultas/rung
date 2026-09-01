import type { Level } from "../lib/content-types";
import { suggestFor } from "../lib/vocab/suggestions";

/*
 * Kişinin bandının BİR ÜSTÜNDEN birkaç kelime.
 *
 * `OffBandStrip` ile karıştırılmasın: o, GÖREV METNİNDE geçen ve kişinin
 * bandının üstünde kalan kelimeleri gösteriyor — yani karşısına çıkanı.
 * Bu ise karşısına ÇIKMAYANI getiriyor: denemesi için birkaç öneri.
 *
 * ÖDEV DEĞİL. Ekrandaki cümle bunu açıkça söylüyor, çünkü söylenmezse bir
 * liste her zaman zorunluluk gibi okunur — ve zorunlu kelime kullandırmak
 * ölçümü bozar: kişinin kendi cümlesini değil, listeye uydurulmuş cümlesini
 * ölçmüş oluruz.
 */
export function WordStretch({
  level,
  userId,
  today,
}: {
  /** Kişinin ÖLÇÜLEN seviyesi — önerilen bandın kendisi değil. */
  level: Level;
  userId: string;
  /** İstanbul takvim günü; öneriler gün boyunca aynı kalıyor. */
  today: string;
}) {
  const { band, words } = suggestFor(level, userId, today);
  if (words.length === 0) return null;

  return (
    <section className="stretch" aria-labelledby="stretch-h">
      <h2 className="stretch-h" id="stretch-h">
        Seni biraz zorlayacak kelimeler
        <span className="stretch-band">{band}</span>
      </h2>
      <p className="stretch-note">
        Seviyenin bir üstünden birkaç kelime. <b>Kullanmak zorunda değilsin</b>
        {" "}— canın isterse birini cümlenin içine yedirmeyi dene. Yarın
        başkaları gelir.
      </p>

      <ul className="stretch-list">
        {words.map((w) => (
          <li key={w.en} className="stretch-word">
            <b className="stretch-en" lang="en">
              {w.en}
            </b>
            <span className="stretch-pos">{w.pos}</span>
            <span className="stretch-tr">{w.tr}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
