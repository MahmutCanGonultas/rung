import assert from "node:assert/strict";
import test from "node:test";

import { analyze } from "./index.ts";

test("boş metin çökmüyor", () => {
  const r = analyze("");
  assert.equal(r.metrics.wordCount, 0);
  assert.deepEqual(r.findings, []);
  assert.equal(r.findingsPer100Words, 0);
});

test("temiz metinde bulgu yok, ölçümler dolu", () => {
  const text =
    "Dear Sarah, I am writing to ask about the deposit for the flat. " +
    "The agreement said the money would be returned within thirty days, " +
    "but nothing has arrived yet. Could you tell me when the transfer will be made?";
  const r = analyze(text);
  assert.deepEqual(r.findings, []);
  assert.equal(r.metrics.wordCount, 39);
  assert.equal(r.metrics.sentenceCount, 3);
  assert.ok(r.bands.distinctWords > 20);
});

test("hatalı metinde hem kural hem yazım bulgusu çıkıyor", () => {
  const r = analyze("i recieved the informations yesterday.");
  const subs = r.findings.map((f) => f.subcategory);
  assert.ok(subs.includes("capitalization"), subs.join(", "));
  assert.ok(subs.includes("spelling"), subs.join(", "));
  assert.ok(subs.includes("countability"), subs.join(", "));
});

test("aynı yeri iki bulgu işaret etmiyor", () => {
  const r = analyze("Thanks for the informations.");
  const spans = r.findings.map((f) => `${f.start}-${f.end}`);
  assert.equal(new Set(spans).size, spans.length);

  // "informations" sadece sayılabilirlik olarak çıkmalı, ayrıca yazım olarak değil.
  const atWord = r.findings.filter((f) => f.original === "informations");
  assert.equal(atWord.length, 1);
  assert.equal(atWord[0].subcategory, "countability");
});

test("100 kelimede bulgu oranı hesaplanıyor", () => {
  const r = analyze("i went home. i came back.");
  assert.equal(r.metrics.wordCount, 6);
  assert.equal(r.findings.length, 2, r.findings.map((f) => f.original).join(","));
  assert.ok(Math.abs(r.findingsPer100Words - (2 / 6) * 100) < 0.001);
});

test("bulgular sıralı ve konumlu", () => {
  const text = "i ate a apple and the the informations.";
  const r = analyze(text);
  const starts = r.findings.map((f) => f.start);
  assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
  for (const f of r.findings) {
    assert.equal(text.slice(f.start, f.end), f.original);
  }
});

test("aynı metin her zaman aynı sonucu veriyor — deterministik", () => {
  const text = "I am agree with the informations you sent me yesterday.";
  assert.deepEqual(analyze(text), analyze(text));
});

test("yazım hatası kelime bandını şişirmiyor", () => {
  const clean = analyze("I received the letter yesterday and read it twice.");
  const typo = analyze("I recieved the letter yesterday and read it twice.");
  // Tek fark bir yazım hatası; "ileri kelime" oranı ondan etkilenmemeli.
  assert.ok(
    typo.bands.aboveBasic <= clean.bands.aboveBasic + 0.001,
    `${typo.bands.aboveBasic} vs ${clean.bands.aboveBasic}`
  );
});
