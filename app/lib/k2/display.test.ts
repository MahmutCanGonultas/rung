import assert from "node:assert/strict";
import test from "node:test";

import { partitionFindings } from "./display.ts";
import type { StoredFinding } from "../analyses.ts";

let counter = 0;
const make = (
  verdict: StoredFinding["verdict"],
  agreed: boolean | null = null
): StoredFinding => ({
  id: String(++counter),
  analysisId: "1",
  subcategory: "tense",
  start: 0,
  end: 3,
  original: "was",
  suggestion: "is",
  explanation: "Zaman uyumsuz.",
  confidence: 0.8,
  layer: "K1",
  verdict,
  agreed,
});

test("reddedilen bulgu kullanıcıya hiç gösterilmiyor", () => {
  const r = partitionFindings([make("confirmed"), make("rejected")]);
  assert.equal(r.visible.length, 1);
  assert.equal(r.filtered, 1);
  assert.ok(r.visible.every((f) => f.verdict !== "rejected"));
});

test("şüpheli gösteriliyor ama SAYILMIYOR", () => {
  const r = partitionFindings([make("confirmed"), make("uncertain")]);
  assert.equal(r.visible.length, 2, "şüpheli gösterilmeli");
  assert.equal(r.counted, 1, "şüpheli hata sayısına girmemeli");
  assert.equal(r.suspect, 1);
});

test("doğrulanmamış bulgu da sayılmıyor", () => {
  const r = partitionFindings([make(null), make("confirmed")]);
  assert.equal(r.visible.length, 2);
  assert.equal(r.counted, 1);
  assert.equal(r.unverified, 1);
});

test("hepsi reddedilirse görünür bulgu kalmıyor", () => {
  const r = partitionFindings([make("rejected"), make("rejected")]);
  assert.equal(r.visible.length, 0);
  assert.equal(r.counted, 0);
  assert.equal(r.filtered, 2);
});

test("boş liste çökmüyor", () => {
  const r = partitionFindings([]);
  assert.deepEqual(r, {
    visible: [],
    counted: 0,
    suspect: 0,
    unverified: 0,
    filtered: 0,
  });
});

test("itiraz durumu görünürlüğü etkilemiyor", () => {
  // Kullanıcı itiraz etti diye bulgu ekrandan kaybolmuyor — itiraz ölçüm
  // verisi, sansür değil.
  const r = partitionFindings([make("confirmed", false)]);
  assert.equal(r.visible.length, 1);
  assert.equal(r.counted, 1);
});
