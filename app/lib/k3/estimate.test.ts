import assert from "node:assert/strict";
import test from "node:test";

import { bandOfScore, estimateLevel } from "./estimate.ts";

const SIMPLE =
  "I live in a small house. I have a cat. My cat is black and white. " +
  "I go to work every day. I like my job. My friends are nice. " +
  "We eat lunch together. The food is good. I am happy.";

const ADVANCED =
  "What strikes me about the result is not the magnitude of the effect but " +
  "its consistency across subgroups, which is considerably harder to explain " +
  "away than a single striking figure would be. Although the sample remains " +
  "modest, the direction held wherever we looked, and that persistence " +
  "constitutes evidence of a different character altogether.";

test("bant eşiği · skor bandına çevriliyor", () => {
  assert.equal(bandOfScore(0), "A1");
  assert.equal(bandOfScore(0.4), "A1");
  assert.equal(bandOfScore(2), "B1");
  assert.equal(bandOfScore(4), "C1");
  assert.equal(bandOfScore(99), "C1", "sınır dışı değer kırpılıyor");
  assert.equal(bandOfScore(-5), "A1");
});

test("basit metin düşük, karmaşık metin yüksek seviye veriyor", () => {
  const simple = estimateLevel(SIMPLE);
  const advanced = estimateLevel(ADVANCED);
  assert.ok(
    advanced.score > simple.score + 0.5,
    `${advanced.score.toFixed(2)} vs ${simple.score.toFixed(2)}`
  );
});

test("dört sinyalin dördü de dönüyor", () => {
  const e = estimateLevel(SIMPLE);
  assert.equal(e.signals.length, 4);
  assert.deepEqual(
    e.signals.map((s) => s.name),
    ["Kelime bandı", "Cümle karmaşıklığı", "Hata yoğunluğu", "Hata türü"]
  );
});

test("hata yoğunluğu TERS yönlü — çok hata düşük seviye", () => {
  const few = estimateLevel(SIMPLE, ["tense"]);
  const many = estimateLevel(SIMPLE, Array.from({ length: 8 }, () => "tense"));
  const densityOf = (e: ReturnType<typeof estimateLevel>) =>
    e.signals.find((s) => s.name === "Hata yoğunluğu")!.value;
  assert.ok(densityOf(few) > densityOf(many), "az hata daha yüksek seviye demeli");
});

test("hata TÜRÜ · temel hatalar düşük, nüans hataları yüksek", () => {
  const kindOf = (subs: string[]) =>
    estimateLevel(ADVANCED, subs).signals.find((s) => s.name === "Hata türü")!.value;
  assert.ok(
    kindOf(["register", "collocation", "vagueness"]) >
      kindOf(["agreement", "spelling", "capitalization"]),
    "nüans hataları daha yüksek seviyeye işaret etmeli"
  );
});

test("hiç hata yoksa 'hata türü' sinyali karar vermiyor", () => {
  const e = estimateLevel(SIMPLE, []);
  const kind = e.signals.find((s) => s.name === "Hata türü")!;
  assert.equal(kind.value, 2, "nötr kalmalı");
  assert.match(kind.detail, /karar vermiyor/);
});

test("kısa metin güvenilmez işaretleniyor", () => {
  assert.equal(estimateLevel("I am here.").reliable, false);
  assert.equal(estimateLevel(ADVANCED).reliable, true);
});

test("boş metin çökmüyor", () => {
  const e = estimateLevel("");
  assert.ok(["A1", "A2", "B1", "B2", "C1"].includes(e.level));
  assert.equal(e.reliable, false);
});

test("deterministik — aynı girdi aynı çıktı", () => {
  assert.deepEqual(estimateLevel(ADVANCED, ["register"]), estimateLevel(ADVANCED, ["register"]));
});
