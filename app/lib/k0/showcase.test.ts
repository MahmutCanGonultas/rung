import assert from "node:assert/strict";
import test from "node:test";

import { analyze } from "./index.ts";
import { segment } from "./segments.ts";
import { SHOWCASE_SAMPLES } from "./showcase-samples.ts";

/*
 * Anasayfanın tek iddiası bu iki sayıya bağlı: aynı motor bozuk cümlede beş
 * bulgu veriyor, doğru cümlede sıfır. Kompozisyon da bağlı — beş bulgu iki
 * sütuna bölünüyor, sıfır bulgu boş bölmeyi kanıt yapıyor.
 *
 * Bu test kırılırsa vitrin yalan söylüyor demektir; düzeltilecek yer sayfa
 * değil, önce hangi kuralın değiştiği.
 */
test("vitrin · bozuk cümle beş bulgu veriyor", () => {
  const { findings } = analyze(SHOWCASE_SAMPLES.broken);
  assert.equal(findings.length, 5);
  assert.deepEqual(
    findings.map((f) => f.subcategory),
    ["tr_pattern", "tr_word_order", "countability", "capitalization", "spelling"]
  );
});

test("vitrin · doğru cümle SESSİZ geçiyor", () => {
  const { findings } = analyze(SHOWCASE_SAMPLES.clean);
  assert.equal(findings.length, 0);
  // Tek düz parça: işaretlenecek hiçbir aralık yok.
  assert.equal(segment(SHOWCASE_SAMPLES.clean, findings).length, 1);
});
