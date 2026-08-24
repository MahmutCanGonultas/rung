import { BAND_ORDER, bandOf, type Band } from "../lib/k0/bands";
import { words } from "../lib/k0/tokenize";
import { NoteWordButton } from "./NoteWordButton";

/*
 * Görev metnindeki, kullanıcının seviyesinin ÜSTÜNDEKİ kelimeler.
 *
 * Bilinmeyen kelimenin gerçekten ortaya çıktığı ilk an bu: görevi okurken.
 * Rung buraya "bunları bilmiyorsun" demiyor — diyemez, öyle bir ölçüm yok.
 * Sadece "bu görevde senin bandının üstünde şu kelimeler var" diyor; hangisini
 * deftere alacağına kullanıcı karar veriyor.
 *
 * Hiç üst bant kelimesi yoksa şerit hiç çizilmiyor. Boş bir kutu göstermek,
 * olmayan bir şeye yer ayırmak olurdu.
 */

const MAX = 6;

export function OffBandStrip({
  prompt,
  level,
  taskId,
  back,
  noted,
}: {
  prompt: string;
  level: Band;
  taskId: string;
  back: string;
  noted: Set<string>;
}) {
  const floor = BAND_ORDER.indexOf(level);

  /*
   * Tekrarları eleyip metindeki sırayı koruyoruz. Küçük harfli anahtar
   * benzersizlik için; ekranda görünen, metindeki hâli.
   */
  const seen = new Set<string>();
  const above: Array<{ surface: string; band: Band }> = [];

  for (const w of words(prompt)) {
    const key = w.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const band = bandOf(key);
    if (BAND_ORDER.indexOf(band) > floor) above.push({ surface: w.text, band });
  }

  if (above.length === 0) return null;

  const shown = above.slice(0, MAX);

  return (
    <div className="offband">
      <p className="offband-head">
        Bu görevde <b>{level}</b> bandının üstünde {above.length} kelime var.
        Bilmediğin varsa deftere al.
      </p>

      <div className="offband-words">
        {shown.map((w) => (
          <NoteWordButton
            key={w.surface}
            surface={w.surface}
            source="task"
            anchorId={taskId}
            snippet={prompt}
            back={back}
            noted={noted.has(w.surface.toLowerCase())}
            compact
          />
        ))}
      </div>

      <p className="offband-note">
        Bant listesi elle derlendi ve yaklaşık — <b>C1</b> burada &quot;listede
        yok&quot; demek, &quot;ileri seviye&quot; demek değil.
      </p>
    </div>
  );
}
