import assert from "node:assert/strict";
import test from "node:test";

import { mergeFindings } from "./findings-merge.ts";
import { segment } from "./k0/segments.ts";
import type { Finding } from "./taxonomy.ts";
import type { StoredFinding } from "./analyses.ts";

const k0 = (start: number, end: number, original: string): Finding => ({
  subcategory: "spelling",
  start,
  end,
  original,
  suggestion: "düzeltme",
  explanation: "Deterministik kural.",
  confidence: 0.99,
  layer: "K0",
});

let sayac = 0;
const k1 = (
  start: number,
  end: number,
  original: string,
  verdict: StoredFinding["verdict"] = "confirmed"
): StoredFinding => ({
  id: String(++sayac),
  analysisId: "a1",
  subcategory: "tense",
  start,
  end,
  original,
  suggestion: "düzeltme",
  explanation: "Model çıkarımı.",
  confidence: 0.8,
  layer: "K1",
  verdict,
  agreed: null,
});

test("boş girdi boş liste", () => {
  assert.deepEqual(mergeFindings([], []), []);
});

test("çakışmayan iki katman da listede", () => {
  const out = mergeFindings([k0(0, 3, "aaa")], [k1(10, 14, "bbbb")]);
  assert.equal(out.length, 2);
  assert.deepEqual(
    out.map((f) => f.layer),
    ["K0", "K1"]
  );
});

test("liste metindeki sıraya göre — katmana göre değil", () => {
  const out = mergeFindings([k0(20, 23, "ccc")], [k1(5, 9, "dddd")]);
  assert.deepEqual(
    out.map((f) => f.start),
    [5, 20]
  );
  assert.equal(out[0].layer, "K1");
});

test("çakışmada K0 kazanıyor, model bulgusu düşüyor", () => {
  const out = mergeFindings([k0(4, 12, "recieved")], [k1(4, 12, "recieved")]);
  assert.equal(out.length, 1);
  assert.equal(out[0].layer, "K0");
});

test("kısmi çakışma da eleniyor", () => {
  // K1 aralığı K0'ın içine taşıyor: 8 < 12, yani kesişiyorlar.
  const out = mergeFindings([k0(4, 12, "recieved")], [k1(8, 20, "ved them")]);
  assert.equal(out.length, 1);
  assert.equal(out[0].layer, "K0");
});

test("bitişik aralıklar çakışma değil", () => {
  // [0,4) ile [4,8) ortak karakter taşımıyor; ikisi de kalmalı.
  const out = mergeFindings([k0(0, 4, "aaaa")], [k1(4, 8, "bbbb")]);
  assert.equal(out.length, 2);
});

test("iki model bulgusu birbiriyle çakışırsa ilki kalıyor", () => {
  const out = mergeFindings([], [k1(0, 10, "önce"), k1(5, 15, "sonra")]);
  assert.equal(out.length, 1);
  assert.equal(out[0].original, "önce");
});

test("model bulgusunun kimliği ve kararı taşınıyor", () => {
  const [f] = mergeFindings([], [k1(0, 4, "was", "uncertain")]);
  assert.ok(f.id);
  assert.equal(f.verdict, "uncertain");
  assert.equal(f.agreed, null);
});

test("K0 bulgusunda kimlik yok — geri bildirim düğmesi çizilmemeli", () => {
  const [f] = mergeFindings([k0(0, 3, "aaa")], []);
  assert.equal(f.id, undefined);
  assert.equal(f.verdict, undefined);
});

/*
 * Asıl sözleşme: birleşmiş liste doğrudan `segment()`e verilebilmeli.
 * Çakışan iki bulgu geçseydi metin negatif uzunlukta dilimlenir ve parçalar
 * birleştiğinde orijinal metni VERMEZDİ — bozulma sessiz olurdu.
 */
test("birleşmiş liste segment() ile metni bozmadan bölüyor", () => {
  const text = "I am agree with the informations you sent me yesterday.";
  const merged = mergeFindings(
    [k0(2, 10, "am agree")],
    [k1(5, 20, "agree with the"), k1(21, 33, "informations")]
  );
  const parts = segment(text, merged);
  assert.equal(parts.map((p) => p.text).join(""), text);
  for (const p of parts) assert.ok(p.text.length > 0);
});

test("segment() sırası ile liste sırası aynı — numaralar tutuyor", () => {
  const text = "one two three four five six seven eight nine ten";
  const merged = mergeFindings([k0(8, 13, "three")], [k1(0, 3, "one"), k1(19, 23, "five")]);
  const isaretli = segment(text, merged)
    .filter((p) => p.kind === "finding")
    .map((p) => (p.kind === "finding" ? p.finding.start : -1));
  assert.deepEqual(
    isaretli,
    merged.map((f) => f.start)
  );
});
