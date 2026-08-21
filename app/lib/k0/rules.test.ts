import assert from "node:assert/strict";
import test from "node:test";

import { applyRules } from "./rules.ts";

const subs = (text: string) => applyRules(text).map((f) => f.subcategory);
const fixes = (text: string) => applyRules(text).map((f) => f.suggestion);

test("küçük i yakalanıyor", () => {
  const found = applyRules("Yesterday i went home.");
  assert.equal(found.length, 1);
  assert.equal(found[0].subcategory, "capitalization");
  assert.equal(found[0].suggestion, "I");
});

test("kelimenin içindeki i yakalanmıyor", () => {
  assert.deepEqual(applyRules("This is interesting."), []);
});

test("cümle küçük harfle başlıyorsa yakalanıyor", () => {
  const found = applyRules("This is fine. this is not.");
  assert.deepEqual(
    found.map((f) => f.suggestion),
    ["T"]
  );
});

test("tekrarlanan kelime", () => {
  const found = applyRules("I sent the the report.");
  assert.equal(found.length, 1);
  assert.equal(found[0].subcategory, "repetition");
  assert.equal(found[0].original, "the the");
});

test('"had had" ve "that that" tekrar sayılmıyor', () => {
  assert.deepEqual(applyRules("I had had enough by then."), []);
});

test("noktalamadan önce boşluk", () => {
  const found = applyRules("Hello , world .");
  assert.equal(found.filter((f) => f.subcategory === "punctuation").length, 2);
});

test("a/an · ünlüden önce an", () => {
  assert.deepEqual(fixes("I ate a apple."), ["an"]);
});

test("a/an · ünsüzden önce a", () => {
  assert.deepEqual(fixes("It was an book."), ["a"]);
});

test("a/an · yazılışı ünlü ama sesi ünsüz olanlar geçiyor", () => {
  assert.deepEqual(applyRules("She is a university student."), []);
  assert.deepEqual(applyRules("It took a European turn."), []);
});

test("a/an · yazılışı ünsüz ama sesi ünlü olanlar geçiyor", () => {
  assert.deepEqual(applyRules("I waited an hour."), []);
  assert.deepEqual(applyRules("He is an honest man."), []);
});

test("sayılamayan isimlerin çoğulu", () => {
  const found = applyRules("Thanks for the informations and advices.");
  assert.deepEqual(
    found.map((f) => f.original),
    ["informations", "advices"]
  );
  assert.deepEqual(found.map((f) => f.suggestion), ["information", "advice"]);
});

test('Türkçe kalıp · "I am agree"', () => {
  const found = applyRules("I am agree with your suggestion.");
  assert.equal(found[0].subcategory, "tr_pattern");
  assert.equal(found[0].suggestion, "I agree");
});

test('Türkçe kalıp · "make a research"', () => {
  const found = applyRules("I will make a research about it.");
  assert.equal(found[0].subcategory, "collocation");
  assert.equal(found[0].suggestion, "do some research");
});

test('Türkçe kalıp · "the meeting of tomorrow"', () => {
  const found = applyRules("We will talk in the meeting of tomorrow.");
  assert.equal(found[0].subcategory, "tr_word_order");
  assert.equal(found[0].suggestion, "tomorrow's meeting");
});

test('Türkçe kalıp · "according to me"', () => {
  assert.equal(applyRules("According to me it is wrong.")[0].suggestion, "in my opinion");
});

test('Türkçe kalıp · "discuss about"', () => {
  assert.equal(applyRules("We should discuss about the plan.")[0].suggestion, "discuss");
});

test('Türkçe kalıp · "explain me"', () => {
  assert.equal(applyRules("Can you explain me this?")[0].suggestion, "explain to me");
});

test("bulgular konumlarına göre sıralı", () => {
  const found = applyRules("i went home. we agreed , finally.");
  const starts = found.map((f) => f.start);
  assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
});

test("konum metne çapalanıyor", () => {
  const text = "Thanks for the informations.";
  const [first] = applyRules(text);
  assert.equal(text.slice(first.start, first.end), "informations");
});

test("temiz metinde hiç bulgu yok", () => {
  const clean =
    "Dear Sarah, I am writing to ask about the deposit for the flat. " +
    "The agreement said the money would be returned within thirty days, " +
    "but nothing has arrived yet. Could you tell me when the transfer will be made?";
  assert.deepEqual(applyRules(clean), []);
});

test("her bulgunun açıklaması ve güveni var", () => {
  for (const f of applyRules("i ate a apple , and the the informations.")) {
    assert.ok(f.explanation.length > 10, f.subcategory);
    assert.ok(f.confidence > 0.9 && f.confidence <= 1);
    assert.equal(f.layer, "K0");
  }
});

test("cümle başındaki küçük i için tek bulgu çıkıyor", () => {
  const found = applyRules("i went home.");
  assert.equal(found.length, 1, found.map((f) => f.subcategory).join(","));
  // Türkçe konuşana daha çok şey anlatan açıklama kazanmalı.
  assert.match(found[0].explanation, /birinci tekil şahıs/);
});

test("cümle ortasındaki küçük i de tek bulgu", () => {
  const found = applyRules("Yesterday i went home and i slept.");
  assert.equal(found.length, 2);
});
