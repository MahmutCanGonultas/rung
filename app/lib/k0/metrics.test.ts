import assert from "node:assert/strict";
import test from "node:test";

import { measure, movingAverageTTR } from "./metrics.ts";

const close = (actual: number, expected: number, tolerance = 0.001) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} ≈ ${expected} değil`
  );

test("boş metin sıfırlarla dönüyor, çökmüyor", () => {
  const m = measure("");
  assert.equal(m.wordCount, 0);
  assert.equal(m.sentenceCount, 0);
  assert.equal(m.avgSentenceLength, 0);
  assert.equal(m.typeTokenRatio, 0);
  assert.equal(m.movingAverageTTR, null);
  assert.equal(m.reliable, false);
});

test("kelime ve cümle sayısı", () => {
  const m = measure("I went home. She stayed here today.");
  assert.equal(m.wordCount, 7);
  assert.equal(m.sentenceCount, 2);
  close(m.avgSentenceLength, 3.5);
});

test("en uzun cümle", () => {
  const m = measure("Short one. This sentence is clearly a good deal longer.");
  assert.equal(m.longestSentence, 8);
});

test("çeşitlilik · tamamı farklı kelime 1.0", () => {
  close(measure("alpha beta gamma delta").typeTokenRatio, 1);
});

test("çeşitlilik · yarısı tekrar 0.5", () => {
  close(measure("cat cat dog dog").typeTokenRatio, 0.5);
});

test("çeşitlilik · büyük/küçük harf aynı kelime sayılıyor", () => {
  close(measure("The the THE").typeTokenRatio, 1 / 3);
});

test("MATTR · pencereden kısa metinde null", () => {
  assert.equal(movingAverageTTR(["a", "b", "c"], 40), null);
});

test("MATTR · tamamı farklıysa 1.0", () => {
  const tokens = Array.from({ length: 60 }, (_, i) => `w${i}`);
  close(movingAverageTTR(tokens, 40) ?? 0, 1);
});

test("MATTR · tek kelime tekrarında 1/pencere", () => {
  const tokens = Array.from({ length: 60 }, () => "same");
  close(movingAverageTTR(tokens, 40) ?? 0, 1 / 40);
});

test("MATTR uzunluk arttıkça ham TTR gibi çökmüyor", () => {
  // Aynı çeşitlilikte iki metin, biri iki kat uzun.
  const pattern = ["one", "two", "three", "four"];
  const short = Array.from({ length: 60 }, (_, i) => pattern[i % 4]);
  const long = Array.from({ length: 240 }, (_, i) => pattern[i % 4]);

  const shortRaw = new Set(short).size / short.length;
  const longRaw = new Set(long).size / long.length;
  assert.ok(longRaw < shortRaw, "ham TTR uzunlukla düşüyor — beklenen");

  close(movingAverageTTR(short, 40) ?? 0, movingAverageTTR(long, 40) ?? 0);
});

test("yan cümle oranı · işaretçi yoksa sıfır", () => {
  assert.equal(measure("I went home. She stayed.").subordinationRatio, 0);
});

test("yan cümle oranı · iki cümlede bir işaretçi 0.5", () => {
  const m = measure("I stayed because it rained. She left.");
  close(m.subordinationRatio, 0.5);
});

test("yan cümle oranı · 'that' bilerek sayılmıyor", () => {
  assert.equal(measure("I know that. The book that I read was good.").subordinationRatio, 0);
});

test("güvenilirlik eşiği", () => {
  const short = Array.from({ length: 39 }, () => "word").join(" ");
  const long = Array.from({ length: 41 }, () => "word").join(" ");
  assert.equal(measure(short).reliable, false);
  assert.equal(measure(long).reliable, true);
});
