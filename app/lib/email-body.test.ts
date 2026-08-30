import assert from "node:assert/strict";
import { test } from "node:test";

import { brevoBody, buildLink, resendBody, toHtml } from "./email-body.ts";

/*
 * Bu yükler üretimde bir kez çalışıyor ve doğru çalışmak zorunda: biri şifresini
 * unuttuğunda ya da yeni bir hesap açılmaya çalışıldığında. Yanlış bir alan adı
 * hata vermiyor, sessizce eksik gönderiyor — o yüzden şekli burada çiviliyoruz.
 */

const MAIL = {
  to: "kisi@example.com",
  subject: "Rung — hesabını aç",
  text: "Merhaba.\n\nhttps://rungscale.com/verify?t=ABC\n\nİyi günler.",
};

const ENV = { from: "merhaba@rungscale.com", fromName: "Rung" };

test("Resend gövdesi: gönderen ad + adres tek dizede", () => {
  const b = resendBody(MAIL, ENV);
  assert.equal(b.from, "Rung <merhaba@rungscale.com>");
  assert.deepEqual(b.to, ["kisi@example.com"]);
  assert.equal(b.subject, MAIL.subject);
  assert.equal(b.text, MAIL.text);
});

test("Resend gövdesi: cevap adresi YOKSA alan hiç yazılmıyor", () => {
  /* Boş bir `reply_to` göndermek, sağlayıcıya geçersiz bir adres vermek olurdu. */
  assert.equal("reply_to" in resendBody(MAIL, ENV), false);
});

test("Resend gövdesi: cevap adresi VARSA `reply_to` — `replyTo` DEĞİL", () => {
  /*
   * REGRESYON. Resend'in Node SDK'sı `replyTo` kabul ediyor ve örneklerin
   * çoğu onu gösteriyor; ham JSON'da o ad sessizce yok sayılıyor. 200 dönüyor,
   * cevap adresi hiç yazılmıyor, kimse fark etmiyor.
   */
  const b = resendBody(MAIL, { ...ENV, replyTo: "mcg-projects@outlook.com" });
  assert.equal(b.reply_to, "mcg-projects@outlook.com");
  assert.equal("replyTo" in b, false);
});

test("Brevo gövdesi: gönderen NESNE, alıcı nesne listesi", () => {
  const b = brevoBody(MAIL, ENV);
  assert.deepEqual(b.sender, { name: "Rung", email: "merhaba@rungscale.com" });
  assert.deepEqual(b.to, [{ email: "kisi@example.com" }]);
  assert.equal(b.textContent, MAIL.text);
  assert.equal("text" in b, false, "Brevo `text` değil `textContent` istiyor");
});

test("Brevo gövdesi: cevap adresi NESNE olarak sarılıyor", () => {
  const b = brevoBody(MAIL, { ...ENV, replyTo: "mcg-projects@outlook.com" });
  assert.deepEqual(b.replyTo, { email: "mcg-projects@outlook.com" });
});

test("Brevo gövdesi: cevap adresi yoksa alan hiç yazılmıyor", () => {
  assert.equal("replyTo" in brevoBody(MAIL, ENV), false);
});

test("iki sağlayıcı da AYNI metni taşıyor", () => {
  const r = resendBody(MAIL, ENV);
  const b = brevoBody(MAIL, ENV);
  assert.equal(r.text, b.textContent);
  assert.equal(r.html, b.htmlContent);
  assert.equal(r.subject, b.subject);
});

test("HTML: bağlantı tıklanabilir oluyor", () => {
  const html = toHtml("Şuna tıkla:\n\nhttps://rungscale.com/verify?t=ABC");
  assert.ok(html.includes('<a href="https://rungscale.com/verify?t=ABC"'));
});

test("HTML: kullanıcı metni kaçırılıyor — enjeksiyon yok", () => {
  /*
   * Mail gövdesine kullanıcıdan gelen bir dize girmiyor BUGÜN. Yarın girerse
   * (adı, konusu) bu satır onu yakalar; kaçırma kaldırılırsa test düşer.
   */
  const html = toHtml("<script>alert(1)</script>");
  assert.equal(html.includes("<script>"), false);
  assert.ok(html.includes("&lt;script&gt;"));
});

test("HTML: boş satır paragraf ayırıyor, tek satır <br> oluyor", () => {
  const html = toHtml("bir\niki\n\nüç");
  assert.ok(html.includes("bir<br>iki"), "tek satır sonu <br> olmalı");
  /*
   * GÖVDE paragrafları sayılıyor, sayfadaki bütün `<p>`ler değil: şablonun
   * başında bir de `rung.` marka satırı var ve o ayrı bir stille çiziliyor.
   * Ham `<p ` saymak markayı da sayıp testi yanlış yerden düşürüyordu.
   */
  const govde = (html.match(/margin:0 0 16px/g) ?? []).length;
  assert.equal(govde, 2, "iki gövde paragrafı olmalı");
  assert.ok(html.includes(">rung.<"), "marka satırı duruyor");
});

test("bağlantı: taban sonunda eğik çizgi olsa da olmasa da aynı", () => {
  assert.equal(
    buildLink("/verify?t=ABC", "https://rungscale.com"),
    "https://rungscale.com/verify?t=ABC"
  );
  assert.equal(
    buildLink("/verify?t=ABC", "https://rungscale.com/"),
    "https://rungscale.com/verify?t=ABC"
  );
});

test("bağlantı: tabanın yolu varsa KÖK alınıyor", () => {
  /* `APP_URL` yanlışlıkla bir yol içerirse bağlantı yine doğru yere gitsin. */
  assert.equal(
    buildLink("/reset/start?t=X", "https://rungscale.com/bir/yer"),
    "https://rungscale.com/reset/start?t=X"
  );
});

test("bağlantı: sorgu dizesi bozulmuyor", () => {
  const url = buildLink("/verify?t=aB-_9xYz", "https://www.rungscale.com");
  assert.equal(url, "https://www.rungscale.com/verify?t=aB-_9xYz");
});
