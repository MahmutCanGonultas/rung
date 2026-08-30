import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeEmail, validateEmail, validatePassword } from "./validation.ts";

/*
 * Kayıt kapısının kuralları. Buradan geçen her adres bir bekleyen kayıt satırı
 * ve bir gönderim denemesi doğuruyor — yani yanlış geçen bir adres, kişiyi
 * asla gelmeyecek bir maili beklemeye gönderiyor.
 */

/* ── Türkçe harf ───────────────────────────────────────────────────── */

test("Türkçe harfli adres REDDEDİLİYOR ve sebebi yazıyor", () => {
  /*
   * REGRESYON. Bu adresler eskiden geçiyordu: doğrulamayı, MX eleğini,
   * bekleyen kayıt yazımını — sonra gönderim patlıyor ve kişi "biraz sonra
   * tekrar dene" görüyordu. Sonsuza kadar deneyebilirdi, çünkü mesaj yanlış
   * şeyi söylüyordu. Ürün sahibinin kendi testinde yakalandı.
   */
  for (const adres of [
    "ayşe@gmail.com",
    "çağla@outlook.com",
    "mehmet@şirket.com",
    "gonultaş@hotmail.com",
    "afsfsfdsgıgıdsfbgdsfıgdı@outlook.com",
  ]) {
    const hata = validateEmail(normalizeEmail(adres));
    assert.ok(hata, `${adres} geçmemeliydi`);
    assert.match(hata, /Türkçe harf/, `${adres} için sebep açıkça yazmalı`);
  }
});

test("İngilizce harfli adresler GEÇİYOR", () => {
  for (const adres of [
    "ayse@gmail.com",
    "m.cangonultas@outlook.com",
    "mcg-projects@outlook.com",
    "kisi+etiket@bilkent.edu.tr",
    "a_b.c@turkcell.com.tr",
  ]) {
    assert.equal(validateEmail(normalizeEmail(adres)), null, `${adres} geçmeliydi`);
  }
});

test("Türkçe İ normalleştirmesi hâlâ çalışıyor ve ASCII kalıyor", () => {
  /*
   * "İ".toLowerCase() tek harf değil "i" + U+0307 üretiyor. Birleşen nokta
   * atılmasaydı adres ASCII dışı kalır ve YENİ kural onu reddederdi — yani
   * telefonda otomatik büyük harfle yazan herkes kapıda kalırdı.
   */
  const yazilan = normalizeEmail("İsmail@Rung.test");
  assert.equal(yazilan, "ismail@rung.test");
  assert.equal(validateEmail(yazilan), null);
});

/* ── biçim ─────────────────────────────────────────────────────────── */

test("bariz bozuk adresler eleniyor", () => {
  for (const adres of [
    "",
    "bu-bir-eposta-degil",
    "@yok.com",
    "kisi@",
    "kisi@nokta-yok",
    "iki@sey@var.com",
    "bosluk var@x.com",
  ]) {
    assert.ok(validateEmail(adres), `${adres} elenmeliydi`);
  }
});

test("adres uzunluğu sınırlı", () => {
  assert.ok(validateEmail("a".repeat(300) + "@x.com"));
});

/* ── şifre ─────────────────────────────────────────────────────────── */

test("kısa şifre reddediliyor, sınır söyleniyor", () => {
  const hata = validatePassword("kisa");
  assert.ok(hata);
  assert.match(hata, /8/);
});

test("bcrypt'in 72 bayt sınırı GİZLENMİYOR", () => {
  /*
   * bcrypt girdinin ilk 72 baytını okuyup gerisini sessizce atıyor. Türkçe
   * harfler iki bayt: 40 karakterlik bir şifre 72 baytı aşabiliyor. Sınırı
   * gizlemek, kişinin son harflerinin hiçbir işe yaramadığını bilmemesi
   * demek.
   */
  const uzun = "ş".repeat(40);
  assert.ok(new TextEncoder().encode(uzun).length > 72);
  const hata = validatePassword(uzun);
  assert.ok(hata);
  assert.match(hata, /bayt/);
});

test("sınırın altındaki Türkçe şifre geçiyor", () => {
  assert.equal(validatePassword("şifreçğüö123"), null);
});
