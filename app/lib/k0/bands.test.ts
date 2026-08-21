import assert from "node:assert/strict";
import test from "node:test";

import { bandOf, profile } from "./bands.ts";

test("temel kelimeler A1", () => {
  for (const w of ["the", "and", "house", "water", "good"]) {
    assert.equal(bandOf(w), "A1", w);
  }
});

test("orta seviye kelimeler A2 veya B1", () => {
  for (const w of ["accident", "environment", "opinion"]) {
    assert.ok(["A2", "B1"].includes(bandOf(w)), `${w} → ${bandOf(w)}`);
  }
});

test("soyut kelimeler B1 veya B2", () => {
  for (const w of ["consequence", "acknowledge", "framework"]) {
    assert.ok(["B1", "B2"].includes(bandOf(w)), `${w} → ${bandOf(w)}`);
  }
});

test("nadir kelimeler C1'e düşüyor", () => {
  for (const w of ["obfuscate", "peripatetic", "quixotic"]) {
    assert.equal(bandOf(w), "C1", w);
  }
});

test("aynı kelime hem A1 hem A2 listesindeyse A1 kazanıyor", () => {
  // "school" iki listede de var; en düşük band doğru cevap.
  assert.equal(bandOf("school"), "A1");
});

test("çekim ekleri soyuluyor · çoğul", () => {
  assert.equal(bandOf("houses"), bandOf("house"));
  assert.equal(bandOf("cities"), bandOf("city"));
});

test("çekim ekleri soyuluyor · geçmiş zaman", () => {
  assert.equal(bandOf("worked"), bandOf("work"));
  assert.equal(bandOf("liked"), bandOf("like"));
  assert.equal(bandOf("stopped"), bandOf("stop"));
});

test("çekim ekleri soyuluyor · -ing", () => {
  assert.equal(bandOf("working"), bandOf("work"));
  assert.equal(bandOf("writing"), bandOf("write"));
  assert.equal(bandOf("running"), bandOf("run"));
});

test("büyük harf bandı değiştirmiyor", () => {
  assert.equal(bandOf("House"), bandOf("house"));
});

test("profil · basit metin ağırlıklı A1", () => {
  const p = profile("The cat is on the table and the dog is under the chair.");
  assert.ok(p.shares.A1 > 0.8, JSON.stringify(p.shares));
  assert.ok(p.aboveBasic < 0.2);
});

test("profil · soyut metin temel bandın üstüne çıkıyor", () => {
  const p = profile(
    "The consequence of this framework is a substantial acknowledgement of " +
      "institutional constraints and their cumulative implications."
  );
  assert.ok(p.aboveBasic > 0.4, JSON.stringify(p.shares));
});

test("profil · aynı kelime iki kez sayılmıyor", () => {
  const p = profile("dog dog dog cat");
  assert.equal(p.distinctWords, 2);
});

test("profil · boş metin çökmüyor", () => {
  const p = profile("");
  assert.equal(p.distinctWords, 0);
  assert.equal(p.aboveBasic, 0);
});

test("yoksayılan kelimeler banda girmiyor", () => {
  const withAll = profile("the cat recieved a letter");
  const withoutTypo = profile("the cat recieved a letter", new Set(["recieved"]));
  assert.equal(withAll.distinctWords, 5);
  assert.equal(withoutTypo.distinctWords, 4);
  assert.ok(withoutTypo.aboveBasic < withAll.aboveBasic);
});
