import assert from "node:assert/strict";
import { test } from "node:test";

import { suggestFor, type Suggestion } from "./suggestions.ts";
import { BAND_ORDER } from "../k0/bands.ts";

/*
 * Bu liste ELLE derlendi ve elle derlenen listeler sessizce bozulur: iki kez
 * yazılmış bir kelime, boş kalmış bir karşılık, yanlış banda düşmüş bir
 * öneri. Testler o üç şeyi tutuyor.
 */

const HER_SEVIYE = BAND_ORDER;

test("her seviyeye bir ÜST banttan öneri geliyor", () => {
  const beklenen: Record<string, string> = {
    A1: "A2",
    A2: "B1",
    B1: "B2",
    B2: "C1",
    /* C1'in üstü yok: o bant zaten "listenin dışı". */
    C1: "C1",
  };
  for (const level of HER_SEVIYE) {
    assert.equal(suggestFor(level, "7", "2026-09-01").band, beklenen[level], level);
  }
});

test("hiçbir seviyede öneri boş kalmıyor", () => {
  for (const level of HER_SEVIYE) {
    const { words } = suggestFor(level, "7", "2026-09-01");
    assert.equal(words.length, 4, level);
  }
});

test("aynı kişi aynı gün aynı listeyi görüyor", () => {
  const a = suggestFor("B1", "42", "2026-09-01").words.map((w) => w.en);
  const b = suggestFor("B1", "42", "2026-09-01").words.map((w) => w.en);
  assert.deepEqual(a, b);
});

test("ertesi gün liste değişiyor", () => {
  const a = suggestFor("B1", "42", "2026-09-01").words.map((w) => w.en).join();
  const b = suggestFor("B1", "42", "2026-09-02").words.map((w) => w.en).join();
  assert.notEqual(a, b);
});

test("bir listede aynı kelime iki kez çıkmıyor", () => {
  for (const level of HER_SEVIYE) {
    const en = suggestFor(level, "7", "2026-09-01").words.map((w) => w.en);
    assert.equal(new Set(en).size, en.length, level);
  }
});

/*
 * Bütün bantları gezmek için otuz gün × beş seviye deneniyor: listenin
 * tamamı böylece kontrolden geçiyor, yalnız bugün seçilenler değil.
 */
function hepsi(): Suggestion[] {
  const out: Suggestion[] = [];
  for (const level of HER_SEVIYE) {
    for (let g = 1; g <= 30; g++) {
      out.push(...suggestFor(level, String(g), `2026-09-${String(g).padStart(2, "0")}`, 4).words);
    }
  }
  return out;
}

test("her önerinin İngilizcesi, Türkçesi ve türü dolu", () => {
  for (const w of hepsi()) {
    assert.match(w.en, /^[a-z][a-z-]*$/, `İngilizce bozuk: ${w.en}`);
    assert.ok(w.tr.trim().length > 1, `Türkçe karşılık boş: ${w.en}`);
    assert.ok(
      ["fiil", "isim", "sıfat", "zarf", "bağlaç"].includes(w.pos),
      `tür tanınmıyor: ${w.en} · ${w.pos}`
    );
  }
});

test("aynı kelime iki farklı Türkçe karşılıkla geçmiyor", () => {
  const harita = new Map<string, string>();
  for (const w of hepsi()) {
    const onceki = harita.get(w.en);
    if (onceki !== undefined) assert.equal(onceki, w.tr, `çelişki: ${w.en}`);
    harita.set(w.en, w.tr);
  }
});
