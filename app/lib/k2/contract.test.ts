import assert from "node:assert/strict";
import test from "node:test";

import { validateVerdicts, VerdictResponseSchema } from "./contract.ts";

test("her bulgu için karar dönüyor", () => {
  const decisions = validateVerdicts(3, {
    verdicts: [
      { index: 0, verdict: "confirmed", reason: "Doğru." },
      { index: 1, verdict: "rejected", reason: "Aslında doğru yazılmış." },
      { index: 2, verdict: "uncertain", reason: "Tartışmalı." },
    ],
  });
  assert.deepEqual(
    decisions.map((d) => d.verdict),
    ["confirmed", "rejected", "uncertain"]
  );
});

test("EKSİK karar 'confirmed' sayılmıyor, 'uncertain' oluyor", () => {
  const decisions = validateVerdicts(3, {
    verdicts: [{ index: 0, verdict: "confirmed", reason: "Doğru." }],
  });
  assert.equal(decisions.length, 3);
  assert.equal(decisions[1].verdict, "uncertain");
  assert.equal(decisions[2].verdict, "uncertain");
});

test("sıra dışı indeks yok sayılıyor", () => {
  const decisions = validateVerdicts(2, {
    verdicts: [
      { index: 5, verdict: "confirmed", reason: "Olmayan bulgu." },
      { index: 0, verdict: "rejected", reason: "Var olan." },
    ],
  });
  assert.equal(decisions[0].verdict, "rejected");
  assert.equal(decisions[1].verdict, "uncertain");
});

test("aynı indeks iki kez gelirse ilki geçerli", () => {
  const decisions = validateVerdicts(1, {
    verdicts: [
      { index: 0, verdict: "rejected", reason: "İlk." },
      { index: 0, verdict: "confirmed", reason: "İkinci." },
    ],
  });
  assert.equal(decisions[0].verdict, "rejected");
});

test("boş cevapta hepsi uncertain", () => {
  const decisions = validateVerdicts(2, { verdicts: [] });
  assert.deepEqual(
    decisions.map((d) => d.verdict),
    ["uncertain", "uncertain"]
  );
});

test("şema taksonomi dışı karar kabul etmiyor", () => {
  const bad = VerdictResponseSchema.safeParse({
    verdicts: [{ index: 0, verdict: "probably", reason: "x" }],
  });
  assert.ok(!bad.success);
});
