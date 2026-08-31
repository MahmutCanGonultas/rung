import assert from "node:assert/strict";
import { test } from "node:test";

import { ScanSchema, SYSTEM_PROMPT, isImageType } from "./contract.ts";

/*
 * İSTEMİN TEK KURALI SINANIYOR.
 *
 * Bir istemi birim testiyle sınamak alışılmadık ve çoğu zaman anlamsız: içindeki
 * cümlelerin varlığı, modelin onlara uyduğunu göstermiyor. Buradaki tek cümle
 * ise ayrı bir şey — ÜRÜNÜN GEÇERLİLİĞİ ona bağlı.
 *
 * Model fotoğraftaki yazımı düzeltirse ölçüm kişinin değil MODELİN seviyesini
 * ölçmüş olur. İstem zamanla düzenlenecek (v2, v3) ve bu kuralın bir düzenleme
 * sırasında yanlışlıkla yumuşatılması, sessizce çalışmaya devam eden ama artık
 * yanlış ölçen bir ürün demek. Test o cümleyi yerinde tutuyor.
 */
test("istem düzeltmeyi açıkça yasaklıyor", () => {
  assert.match(SYSTEM_PROMPT, /TRANSCRIBE\. DO NOT CORRECT\./);
  assert.match(SYSTEM_PROMPT, /errors included/i);
});

/*
 * Metnin İÇİNE yer tutucu yazmak da yasak: `[?]` ölçüm katmanına bir yazım
 * hatası olarak girer ve kişiye YAPMADIĞI bir hata gösterilir.
 */
test("istem metne yer tutucu koymayı yasaklıyor", () => {
  assert.match(SYSTEM_PROMPT, /Never put placeholders/);
  assert.match(SYSTEM_PROMPT, /\[illegible\]/);
});

test("çeviri yasak — sayfa hangi dildeyse o dilde kalıyor", () => {
  assert.match(SYSTEM_PROMPT, /Do not translate/);
});

test("şema üç alanı da istiyor", () => {
  const ok = ScanSchema.safeParse({
    text: "i am agree",
    uncertain: ["agree"],
    legible: true,
  });
  assert.equal(ok.success, true);

  assert.equal(ScanSchema.safeParse({ text: "x", legible: true }).success, false);
  assert.equal(ScanSchema.safeParse({ uncertain: [], legible: true }).success, false);
  assert.equal(
    ScanSchema.safeParse({ text: "x", uncertain: "agree", legible: true }).success,
    false
  );
});

test("okunamayan kare boş metinle geliyor", () => {
  const bos = ScanSchema.parse({ text: "", uncertain: [], legible: false });
  assert.equal(bos.legible, false);
  assert.equal(bos.text, "");
});

/*
 * TÜR SÜZGECİ. Gelen `mediaType` istemciden geliyor; süzülmezse doğrudan
 * modele gidiyor ve orada ne olacağı bizim kararımız olmaktan çıkıyor.
 */
test("yalnızca modelin kabul ettiği türler geçiyor", () => {
  for (const iyi of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
    assert.equal(isImageType(iyi), true, iyi);
  }
  for (const kotu of [
    "image/svg+xml",
    "application/pdf",
    "text/html",
    "image/heic",
    "IMAGE/JPEG",
    "",
    "image/jpeg ",
  ]) {
    assert.equal(isImageType(kotu), false, kotu);
  }
});
