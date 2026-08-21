import assert from "node:assert/strict";
import test from "node:test";

import { segment } from "./segments.ts";
import { analyze } from "./index.ts";

test("bulgu yoksa tek parça", () => {
  const s = segment("hello world", []);
  assert.deepEqual(s, [{ kind: "plain", text: "hello world" }]);
});

test("parçalar birleşince orijinal metni veriyor", () => {
  const text = "i ate a apple and the the informations.";
  const { findings } = analyze(text);
  assert.equal(segment(text, findings).map((s) => s.text).join(""), text);
});

test("bulgu parçaları doğru metni taşıyor", () => {
  const text = "Yesterday i went home.";
  const { findings } = analyze(text);
  const marks = segment(text, findings).filter((s) => s.kind === "finding");
  assert.equal(marks.length, 1);
  assert.equal(marks[0].text, "i");
});

test("boş metin boş liste", () => {
  assert.deepEqual(segment("", []), []);
});
