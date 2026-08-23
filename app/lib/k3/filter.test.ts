import assert from "node:assert/strict";
import test from "node:test";

import { filterForLevel, hiddenReason, limitFor, priorityOf } from "./filter.ts";
import type { Finding, Subcategory } from "../taxonomy.ts";

let n = 0;
const f = (subcategory: Subcategory, confidence = 0.9): Finding => ({
  subcategory,
  start: n,
  end: ++n,
  original: "x",
  suggestion: null,
  explanation: "y",
  confidence,
  layer: "K1",
});

test("planın kurucu örneği · zaman hatası A1'de öncelikli, C1'de değil", () => {
  assert.ok(
    priorityOf("tense", "A1") > priorityOf("tense", "C1"),
    "I go to school yesterday — A1'de ders, C1'de dalgınlık"
  );
});

test("kayıt uyumu A1'de hiç gösterilmiyor, C1'de asıl mesele", () => {
  assert.equal(priorityOf("register", "A1"), 0);
  assert.equal(priorityOf("register", "C1"), 3);
});

test("Türkçe kaynaklı kalıp her seviyede önemli", () => {
  for (const level of ["A1", "A2", "B1", "B2", "C1"] as const) {
    assert.ok(priorityOf("tr_pattern", level) >= 2, level);
  }
});

test("AYNI METİN A1 ve C1 kullanıcısına farklı görünüyor", () => {
  const findings = [f("register"), f("tense"), f("collocation"), f("agreement")];

  const a1 = filterForLevel(findings, "A1");
  const c1 = filterForLevel(findings, "C1");

  const subs = (r: typeof a1) => r.shown.map((x) => x.subcategory);

  assert.ok(subs(a1).includes("tense"), "A1'e zaman hatası gösterilmeli");
  assert.ok(!subs(a1).includes("register"), "A1'e kayıt uyumu gösterilmemeli");
  assert.ok(subs(c1).includes("register"), "C1'e kayıt uyumu gösterilmeli");
  assert.notDeepEqual(subs(a1), subs(c1), "iki seviye aynı şeyi görmemeli");
});

test("A1'e en fazla üç bulgu gösteriliyor", () => {
  const findings = Array.from({ length: 10 }, () => f("tense"));
  const r = filterForLevel(findings, "A1");
  assert.equal(r.shown.length, 3);
  assert.equal(r.overLimit, 7);
});

test("C1'in sınırı çok daha geniş", () => {
  assert.ok(limitFor("C1") > limitFor("A1"));
});

test("öncelik sırası: yüksek öncelik önce, eşitse yüksek güven", () => {
  const low = f("punctuation", 0.99); // A1'de öncelik 2
  const high = f("agreement", 0.5); // A1'de öncelik 3
  const r = filterForLevel([low, high], "A1");
  assert.equal(r.shown[0].subcategory, "agreement", "öncelik güvenden önce gelir");
});

test("eşit öncelikte güven sıralıyor", () => {
  const a = f("tense", 0.6);
  const b = f("tense", 0.95);
  const r = filterForLevel([a, b], "A1");
  assert.equal(r.shown[0].confidence, 0.95);
});

test("gizlenme sebebi ayırt ediliyor — seviye mi sınır mı", () => {
  assert.equal(hiddenReason(f("register"), "A1"), "level");
  assert.equal(hiddenReason(f("tense"), "A1"), "limit");
});

test("gizlenenler kayboluyor değil, sayılıyor", () => {
  const findings = [f("register"), ...Array.from({ length: 5 }, () => f("tense"))];
  const r = filterForLevel(findings, "A1");
  assert.equal(r.shown.length + r.hidden.length, findings.length);
});

test("boş liste çökmüyor", () => {
  const r = filterForLevel([], "B1");
  assert.deepEqual(r, { shown: [], hidden: [], overLimit: 0 });
});
