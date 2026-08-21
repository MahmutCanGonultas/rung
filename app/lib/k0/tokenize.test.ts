import assert from "node:assert/strict";
import test from "node:test";

import { sentences, words } from "./tokenize.ts";

test("kelime · basit cümle", () => {
  assert.deepEqual(
    words("I go to school").map((w) => w.text),
    ["I", "go", "to", "school"]
  );
});

test("kelime · kesme işareti kelimeyi bölmüyor", () => {
  assert.deepEqual(
    words("I don't like Sarah's plan").map((w) => w.text),
    ["I", "don't", "like", "Sarah's", "plan"]
  );
});

test("kelime · tireli kelime tek sayılıyor", () => {
  assert.deepEqual(
    words("a state-of-the-art system").map((w) => w.text),
    ["a", "state-of-the-art", "system"]
  );
});

test("kelime · sayılar kelime değil", () => {
  assert.deepEqual(
    words("I paid 3500 lira in 2026").map((w) => w.text),
    ["I", "paid", "lira", "in"]
  );
});

test("kelime · konumlar doğru", () => {
  const [first, second] = words("hello world");
  assert.deepEqual([first.start, first.end], [0, 5]);
  assert.deepEqual([second.start, second.end], [6, 11]);
});

test("cümle · üç cümle", () => {
  assert.deepEqual(
    sentences("I went home. She stayed. We talked later.").map((s) => s.text),
    ["I went home.", "She stayed.", "We talked later."]
  );
});

test("cümle · kısaltmadaki nokta bölmüyor", () => {
  assert.deepEqual(
    sentences("Dr. Smith arrived late. He was tired.").map((s) => s.text),
    ["Dr. Smith arrived late.", "He was tired."]
  );
});

test("cümle · e.g. ve etc. bölmüyor", () => {
  const result = sentences("Bring fruit, e.g. apples, pears, etc. Then leave.");
  assert.equal(result.length, 2);
  assert.equal(result[1].text, "Then leave.");
});

test("cümle · ondalık sayı bölmüyor", () => {
  assert.deepEqual(
    sentences("The rate is 3.5 percent. That is high.").map((s) => s.text),
    ["The rate is 3.5 percent.", "That is high."]
  );
});

test("cümle · soru ve ünlem", () => {
  assert.deepEqual(
    sentences("Are you sure? Really! I doubt it.").map((s) => s.text),
    ["Are you sure?", "Really!", "I doubt it."]
  );
});

test("cümle · arka arkaya noktalama tek cümle", () => {
  assert.deepEqual(
    sentences("Really?! I had no idea.").map((s) => s.text),
    ["Really?!", "I had no idea."]
  );
});

test("cümle · noktalamayla bitmeyen son parça da cümle", () => {
  assert.deepEqual(
    sentences("First one. Second one without a dot").map((s) => s.text),
    ["First one.", "Second one without a dot"]
  );
});

test("cümle · boş metin boş liste", () => {
  assert.deepEqual(sentences(""), []);
  assert.deepEqual(sentences("   \n  "), []);
});

test("cümle · konumlar metne çapalanıyor", () => {
  const text = "One. Two.";
  const [a, b] = sentences(text);
  assert.equal(text.slice(a.start, a.end), "One.");
  assert.equal(text.slice(b.start, b.end), "Two.");
});

test("cümle · unvan büyük harften önce bölmüyor", () => {
  assert.deepEqual(
    sentences("I met Dr. Smith today. He helped me.").map((s) => s.text),
    ["I met Dr. Smith today.", "He helped me."]
  );
});

test("cümle · etc. cümle sonundaysa bölüyor", () => {
  assert.deepEqual(
    sentences("Bring apples, pears, etc. Then leave.").map((s) => s.text),
    ["Bring apples, pears, etc.", "Then leave."]
  );
});

test("cümle · e.g. cümle içindeyse bölmüyor", () => {
  assert.deepEqual(
    sentences("Bring fruit, e.g. apples and pears.").map((s) => s.text),
    ["Bring fruit, e.g. apples and pears."]
  );
});
