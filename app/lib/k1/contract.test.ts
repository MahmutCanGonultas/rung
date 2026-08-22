import assert from "node:assert/strict";
import test from "node:test";

import { validate, type RawResponse } from "./contract.ts";

const TEXT = "I am agree with your plan but I am boring in the last years.";

const wrap = (findings: RawResponse["findings"]): RawResponse => ({ findings });

test("geçerli bulgu kabul ediliyor ve konumu bulunuyor", () => {
  const { findings, rejected } = validate(
    TEXT,
    wrap([
      {
        subcategory: "wrong_word",
        original: "I am boring",
        suggestion: "I am bored",
        explanation: "Sıkılan kişi için bored kullanılır.",
        confidence: 0.9,
      },
    ])
  );

  assert.equal(rejected.length, 0);
  assert.equal(findings.length, 1);
  assert.equal(TEXT.slice(findings[0].start, findings[0].end), "I am boring");
  assert.equal(findings[0].layer, "K1");
});

test("UYDURMA bulgu eleniyor — metinde geçmeyen parça", () => {
  const { findings, rejected } = validate(
    TEXT,
    wrap([
      {
        subcategory: "collocation",
        original: "this is not in the text at all",
        suggestion: "x",
        explanation: "Uydurma.",
        confidence: 0.99,
      },
    ])
  );

  assert.equal(findings.length, 0);
  assert.equal(rejected.length, 1);
  assert.match(rejected[0].reason, /metinde geçmiyor/);
});

test("taksonomi dışı kod eleniyor", () => {
  const { findings, rejected } = validate(
    TEXT,
    wrap([
      {
        subcategory: "made_up_category",
        original: "I am agree",
        suggestion: "I agree",
        explanation: "Bir açıklama.",
        confidence: 0.9,
      },
    ])
  );

  assert.equal(findings.length, 0);
  assert.match(rejected[0].reason, /taksonomide olmayan/);
});

test("geçersiz güven değeri eleniyor", () => {
  const { rejected } = validate(
    TEXT,
    wrap([
      {
        subcategory: "tense",
        original: "I am agree",
        suggestion: null,
        explanation: "Bir açıklama.",
        confidence: 7,
      },
    ])
  );
  assert.match(rejected[0].reason, /geçersiz güven/);
});

test("çok kısa açıklama eleniyor", () => {
  const { rejected } = validate(
    TEXT,
    wrap([
      {
        subcategory: "tense",
        original: "I am agree",
        suggestion: null,
        explanation: "yok",
        confidence: 0.8,
      },
    ])
  );
  assert.match(rejected[0].reason, /açıklama/);
});

test("büyük/küçük harf farkıyla da konum bulunuyor", () => {
  const { findings } = validate(
    TEXT,
    wrap([
      {
        subcategory: "tr_pattern",
        original: "i am agree",
        suggestion: "I agree",
        explanation: "Türkçe kalıp etkisi.",
        confidence: 0.95,
      },
    ])
  );
  assert.equal(findings.length, 1);
  // Konum metinden alındığı için orijinal büyük harfli hâli saklanıyor.
  assert.equal(findings[0].original, "I am agree");
});

test("geçerli ve geçersiz karışık gelirse sadece geçerliler kalıyor", () => {
  const { findings, rejected } = validate(
    TEXT,
    wrap([
      {
        subcategory: "wrong_word",
        original: "I am boring",
        suggestion: "I am bored",
        explanation: "Sıkılan kişi için bored kullanılır.",
        confidence: 0.9,
      },
      {
        subcategory: "collocation",
        original: "nowhere in the text",
        suggestion: null,
        explanation: "Uydurma bulgu.",
        confidence: 0.9,
      },
    ])
  );
  assert.equal(findings.length, 1);
  assert.equal(rejected.length, 1);
});

test("boş cevap sorunsuz", () => {
  const { findings, rejected } = validate(TEXT, wrap([]));
  assert.deepEqual(findings, []);
  assert.deepEqual(rejected, []);
});
