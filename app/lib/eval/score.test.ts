import assert from "node:assert/strict";
import test from "node:test";

import { score, total, type Expectation } from "./score.ts";
import type { Finding, Subcategory } from "../taxonomy.ts";

const exp = (
  start: number,
  end: number,
  subcategory: Subcategory = "tense",
  optional = false
): Expectation => ({ start, end, subcategory, original: "x", optional });

const fnd = (
  start: number,
  end: number,
  subcategory: Subcategory = "tense"
): Finding => ({
  subcategory,
  start,
  end,
  original: "x",
  suggestion: null,
  explanation: "y",
  confidence: 0.9,
  layer: "K1",
});

const close = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 0.0001, `${a} ≈ ${b} değil`);

test("hepsini doğru bulursa isabet 1, yakalama 1, yanlış alarm 0", () => {
  const s = score([exp(0, 5), exp(10, 15)], [fnd(0, 5), fnd(10, 15)]);
  assert.equal(s.truePositive, 2);
  assert.equal(s.falsePositive, 0);
  assert.equal(s.falseNegative, 0);
  close(s.precision, 1);
  close(s.recall, 1);
  close(s.falseAlarmRate, 0);
});

test("hiç bulamazsa yakalama 0, yanlış alarm 0", () => {
  const s = score([exp(0, 5), exp(10, 15)], []);
  assert.equal(s.falseNegative, 2);
  close(s.recall, 0);
  // Hiçbir şey söylemedi — yanlış alarm da vermedi.
  close(s.falseAlarmRate, 0);
  close(s.precision, 1);
});

test("TEMİZ metinde bulgu üretmek doğrudan yanlış alarm", () => {
  const s = score([], [fnd(0, 5)]);
  assert.equal(s.falsePositive, 1);
  close(s.falseAlarmRate, 1);
  close(s.precision, 0);
  // Beklenen hata yoktu, yani yakalanacak bir şey de yoktu.
  close(s.recall, 1);
});

test("temiz metinde hiçbir şey demezse kusursuz", () => {
  const s = score([], []);
  close(s.precision, 1);
  close(s.recall, 1);
  close(s.falseAlarmRate, 0);
});

test("aralık örtüşmesi yeter, birebir eşitlik gerekmiyor", () => {
  const s = score([exp(10, 20)], [fnd(15, 25)]);
  assert.equal(s.truePositive, 1);
  assert.equal(s.falsePositive, 0);
});

test("dokunmayan aralıklar eşleşmiyor", () => {
  const s = score([exp(0, 5)], [fnd(10, 15)]);
  assert.equal(s.truePositive, 0);
  assert.equal(s.falseNegative, 1);
  assert.equal(s.falsePositive, 1);
});

test("aralık doğru kategori yanlış: bulundu sayılıyor, ayrıca işaretleniyor", () => {
  const s = score([exp(0, 5, "tense")], [fnd(0, 5, "article")]);
  assert.equal(s.truePositive, 1, "hatayı buldu");
  assert.equal(s.categoryMismatch, 1, "ama yanlış etiketledi");
  close(s.recall, 1);
});

test("aynı hatayı iki kez raporlamak: biri bulgu, öteki yanlış alarm", () => {
  const s = score([exp(0, 5)], [fnd(0, 5), fnd(1, 4)]);
  assert.equal(s.truePositive, 1);
  assert.equal(s.falsePositive, 1);
  close(s.precision, 0.5);
});

test("tartışmalı beklenti kaçırılırsa yakalamayı düşürmüyor", () => {
  const s = score([exp(0, 5, "tense", true), exp(10, 15)], [fnd(10, 15)]);
  assert.equal(s.falseNegative, 0);
  assert.equal(s.expected, 1, "tartışmalı olan beklenen sayısına girmiyor");
  close(s.recall, 1);
});

test("tartışmalı beklenti bulunursa yanlış alarm sayılmıyor", () => {
  const s = score([exp(0, 5, "tense", true)], [fnd(0, 5)]);
  assert.equal(s.falsePositive, 0);
  close(s.falseAlarmRate, 0);
});

test("karışık durum — sayılar elle doğrulandı", () => {
  // 3 beklenti (biri kaçırıldı), 3 bulgu (biri yanlış alarm)
  const s = score(
    [exp(0, 5), exp(10, 15), exp(30, 35)],
    [fnd(0, 5), fnd(10, 15), fnd(50, 55)]
  );
  assert.equal(s.truePositive, 2);
  assert.equal(s.falseNegative, 1);
  assert.equal(s.falsePositive, 1);
  close(s.precision, 2 / 3);
  close(s.recall, 2 / 3);
  close(s.falseAlarmRate, 1 / 3);
});

test("eşleşmeler hem bulunanı hem kaçırılanı hem fazlalığı taşıyor", () => {
  const s = score([exp(0, 5), exp(30, 35)], [fnd(0, 5), fnd(50, 55)]);
  const found = s.matches.filter((m) => m.expectation && m.finding);
  const missed = s.matches.filter((m) => m.expectation && !m.finding);
  const extra = s.matches.filter((m) => !m.expectation && m.finding);
  assert.equal(found.length, 1);
  assert.equal(missed.length, 1);
  assert.equal(extra.length, 1);
});

test("toplama: iki metnin sonucu tek skora iniyor", () => {
  const a = score([exp(0, 5)], [fnd(0, 5)]);
  const b = score([exp(0, 5)], [fnd(20, 25)]);
  const t = total([a, b]);
  assert.equal(t.expected, 2);
  assert.equal(t.truePositive, 1);
  assert.equal(t.falseNegative, 1);
  assert.equal(t.falsePositive, 1);
  close(t.precision, 0.5);
  close(t.recall, 0.5);
  close(t.falseAlarmRate, 0.5);
});

test("toplamada bölme sıfıra düşmüyor", () => {
  const t = total([score([], []), score([], [])]);
  close(t.precision, 1);
  close(t.recall, 1);
  close(t.falseAlarmRate, 0);
});
