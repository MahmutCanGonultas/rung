import assert from "node:assert/strict";
import test from "node:test";

import { responseSchema, validate } from "./contract.ts";
import { FakeProvider } from "./fake-provider.ts";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt.ts";

const TEXT =
  "I am boring in this job. In the last years nothing changed. " +
  "The report is very much detailed.";

function request(text: string) {
  return {
    system: SYSTEM_PROMPT,
    user: buildUserMessage({
      text,
      level: "B1" as const,
      taskPrompt: "Describe your job",
      taskHint: "Serbest",
      alreadyFound: [],
    }),
    schema: responseSchema(),
  };
}

test("sahte sağlayıcı kalıpları buluyor", async () => {
  const result = await new FakeProvider().complete(request(TEXT));
  const subs = result.parsed.findings.map((f) => f.subcategory);
  assert.deepEqual(subs.sort(), ["preposition", "register", "wrong_word"]);
});

test("sahte sağlayıcının bulguları doğrulamadan geçiyor", async () => {
  const result = await new FakeProvider().complete(request(TEXT));
  const { findings, rejected } = validate(TEXT, result.parsed);
  assert.equal(rejected.length, 0);
  assert.equal(findings.length, 3);
  for (const f of findings) {
    assert.equal(TEXT.slice(f.start, f.end), f.original);
  }
});

test("uydurma açıkken doğrulama onu eliyor", async () => {
  const provider = new FakeProvider({ hallucinate: true });
  const result = await provider.complete(request(TEXT));
  assert.equal(result.parsed.findings.length, 4);

  const { findings, rejected } = validate(TEXT, result.parsed);
  assert.equal(findings.length, 3, "uydurma geçmemeli");
  assert.equal(rejected.length, 1);
  assert.match(rejected[0].reason, /metinde geçmiyor/);
});

test("taksonomi dışı kod açıkken doğrulama onu eliyor", async () => {
  const provider = new FakeProvider({ invalidSubcategory: true });
  const result = await provider.complete(request(TEXT));
  const { rejected } = validate(TEXT, result.parsed);
  assert.equal(rejected.length, 1);
  assert.match(rejected[0].reason, /taksonomide olmayan/);
});

test("istem taksonomi kodlarını içeriyor", () => {
  assert.match(SYSTEM_PROMPT, /tr_pattern/);
  assert.match(SYSTEM_PROMPT, /article_drop/);
  assert.match(SYSTEM_PROMPT, /VERBATIM/);
});

test("K0 bulguları isteme 'tekrar etme' diye giriyor", () => {
  const message = buildUserMessage({
    text: "some text",
    level: "A2",
    taskPrompt: null,
    taskHint: null,
    alreadyFound: ["I am agree", "informations"],
  });
  assert.match(message, /ALREADY REPORTED/);
  assert.match(message, /I am agree/);
  assert.match(message, /informations/);
});

test("şema taksonomiyi enum olarak zorluyor", () => {
  const schema = responseSchema();
  const enumValues =
    schema.properties.findings.items.properties.subcategory.enum;
  assert.ok(enumValues.includes("tr_pattern"));
  assert.ok(!enumValues.includes("made_up"));
});
