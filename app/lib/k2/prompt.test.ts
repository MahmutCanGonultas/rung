import assert from "node:assert/strict";
import test from "node:test";

import { buildVerifyMessage, VERIFY_SYSTEM_PROMPT } from "./prompt.ts";
import type { Finding } from "../taxonomy.ts";

const finding = (over: Partial<Finding> = {}): Finding => ({
  subcategory: "tr_pattern",
  start: 0,
  end: 10,
  original: "I am agree",
  suggestion: "I agree",
  explanation: "Türkçe kalıp etkisi — bu açıklama ikinci geçişe GİTMEMELİ.",
  confidence: 0.97,
  layer: "K1",
  ...over,
});

test("istem hatalı parçayı ve iddia edilen kategoriyi içeriyor", () => {
  const message = buildVerifyMessage("I am agree with you.", [finding()]);
  assert.match(message, /I am agree/);
  assert.match(message, /tr_pattern/);
});

test("K1'in AÇIKLAMASI ikinci geçişe gitmiyor — demir atmasın diye", () => {
  const message = buildVerifyMessage("I am agree with you.", [finding()]);
  assert.ok(
    !message.includes("Türkçe kalıp etkisi"),
    "açıklama sızmış — bağımsız yargı bozulur"
  );
});

test("K1'in GÜVENİ ikinci geçişe gitmiyor", () => {
  const message = buildVerifyMessage("I am agree with you.", [finding()]);
  assert.ok(!message.includes("0.97"), "güven sızmış");
});

test("bulgular indeksli listeleniyor", () => {
  const message = buildVerifyMessage("text", [
    finding({ original: "one" }),
    finding({ original: "two" }),
  ]);
  assert.match(message, /^0\. span: "one"/m);
  assert.match(message, /^1\. span: "two"/m);
});

test("sistem istemi belirsizliği açıkça meşrulaştırıyor", () => {
  assert.match(VERIFY_SYSTEM_PROMPT, /uncertain/);
  assert.match(VERIFY_SYSTEM_PROMPT, /destroys their trust/);
});
