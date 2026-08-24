import { BAND_ORDER, bandOf, type Band } from "../lib/k0/bands";
import { words } from "../lib/k0/tokenize";
import { noteWordAction } from "../lib/vocab/note-actions";
import { NoteWordButton } from "./NoteWordButton";

/*
 * Görev metnindeki, kullanıcının seviyesinin ÜSTÜNDEKİ kelimeler.
 *
 * Bilinmeyen kelimenin gerçekten ortaya çıktığı ilk an bu: görevi okurken.
 * Rung buraya "bunları bilmiyorsun" demiyor — diyemez, öyle bir ölçüm yok.
 * Sadece "bu görevde senin bandının üstünde şu kelimeler var" diyor; hangisini
 * deftere alacağına kullanıcı karar veriyor.
 *
 * Üst bant önerisi ÇIKMAYABİLİR ve bu bir kusur değil, listenin sınırı:
 * C1'de tanım gereği "üstü" yok, dolayısıyla hiçbir C1 görevinde öneri
 * çıkmıyor — ölçüldü, 10 C1 görevinin 10'unda sıfır. Oysa bilinmeyen kelimeye
 * en çok orada rastlanıyor.
 *
 * Bu yüzden şerit HER ZAMAN çiziliyor ve içinde elle ekleme alanı var. Defter
 * bant listesine bağlı olmamalı: öneri "nereye bakabilirsin" demek, asıl
 * özellik kullanıcının kendi kelimesini yazabilmesi.
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

  const shown = above.slice(0, MAX);

  return (
    <div className="offband">
      {above.length > 0 ? (
        <>
          <p className="offband-head">
            Bu görevde <b>{level}</b> bandının üstünde {above.length} kelime
            var. Bilmediğin varsa deftere al.
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
            Bant listesi elle derlendi ve yaklaşık — <b>C1</b> burada
            &quot;listede yok&quot; demek, &quot;ileri seviye&quot; demek
            değil.
          </p>
        </>
      ) : (
        <p className="offband-head">
          Bu görevde <b>{level}</b> bandının üstünde kelime yok. Yine de
          takıldığın bir kelime varsa deftere al.
        </p>
      )}

      {/* Elle ekleme: defterin asıl kapısı. Öneri listesi olmadığında tek
          kapı da bu — ve bant listesinin ulaşamadığı her yeri kapatıyor. */}
      <form action={noteWordAction} className="offband-add">
        <input type="hidden" name="source" value="task" />
        <input type="hidden" name="anchorId" value={taskId} />
        <input type="hidden" name="snippet" value={prompt} />
        <input type="hidden" name="back" value={back} />
        <label className="offband-label" htmlFor="note-word">
          Kendin ekle
        </label>
        <input
          className="input offband-input"
          id="note-word"
          name="surface"
          type="text"
          lang="en"
          autoComplete="off"
          spellCheck={false}
          maxLength={64}
          placeholder="İngilizce tek kelime"
        />
        <button className="btn" type="submit">
          Deftere al
        </button>
      </form>
    </div>
  );
}
