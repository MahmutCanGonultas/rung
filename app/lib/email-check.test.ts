import assert from "node:assert/strict";
import test from "node:test";

import { checkMailbox, type MxLookup } from "./email-check.ts";

/* Sahte DNS: ağa çıkmadan eleğin kurallarını sınıyor. */
const kayitli = (kayitlar: Record<string, string[]>): MxLookup =>
  async (domain) => {
    const mx = kayitlar[domain];
    if (mx === undefined) {
      const e = new Error("NXDOMAIN") as NodeJS.ErrnoException;
      e.code = "ENOTFOUND";
      throw e;
    }
    if (mx.length === 0) {
      const e = new Error("NODATA") as NodeJS.ErrnoException;
      e.code = "ENODATA";
      throw e;
    }
    return mx.map((exchange) => ({ exchange }));
  };

/* Her sınama kendi alan adını kullanıyor: `checkMailbox` sonucu önbelleğe
   alıyor ve ortak bir ad kullanılırsa sınamalar birbirini etkiliyor. */
test("MX kaydı olan alan adı geçiyor", async () => {
  const dns = kayitli({ "a1.ornek": ["mx.a1.ornek"] });
  assert.deepEqual(await checkMailbox("kisi@a1.ornek", dns), { ok: true });
});

test("alan adı hiç yoksa eleniyor", async () => {
  const dns = kayitli({});
  const r = await checkMailbox("kisi@a2.ornek", dns);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "no_mail_server");
});

/*
 * ASIL YAKALANMAK İSTENEN: `gmial.com`, `outlok.com`, `hotmial.com` gerçekten
 * kayıtlı ve A kayıtları var — ama MX kayıtları YOK. İlk sürüm RFC 5321'i
 * izleyip A kaydına düşüyordu ve üçünü de geçiriyordu.
 */
test("kayıtlı ama posta almayan alan adı eleniyor — yazım hatası kalıbı", async () => {
  const dns = kayitli({ "a3.ornek": [] });
  const r = await checkMailbox("kisi@a3.ornek", dns);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "no_mail_server");
});

/* RFC 7505: `MX 0 .` bir alan adının "buraya posta göndermeyin" demesi. */
test("null MX eleniyor", async () => {
  const dns = kayitli({ "a4.ornek": ["."] });
  const r = await checkMailbox("kisi@a4.ornek", dns);
  assert.equal(r.ok, false);
});

test("tek kullanımlık adres DNS'e hiç sorulmadan eleniyor", async () => {
  let soruldu = false;
  const dns: MxLookup = async () => {
    soruldu = true;
    return [{ exchange: "mx" }];
  };
  const r = await checkMailbox("kisi@mailinator.com", dns);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "disposable");
  assert.equal(soruldu, false, "tek kullanımlık liste DNS'ten önce bakılmalı");
});

/*
 * DNS CEVAP VERMEZSE ARTIK ÇEVİRİYOR — eskiden geçiriyordu.
 *
 * Eski gerekçe makuldü: "ağ hıçkırığı yüzünden gerçek bir kullanıcıyı
 * çevirmek, sahte bir adresi almaktan pahalı; arkasında zaten doğrulama
 * bağlantısı var."
 *
 * O gerekçe KAYIT MODELİ DEĞİŞİNCE düştü. Hesap artık yalnız maile giden
 * bağlantıyla açılıyor, yani elekten geçen ölü bir alan adı doğrudan bir
 * HARD BOUNCE demek — ve bounce oranı yeni bir gönderim alan adının
 * yargılandığı ilk sayı. Günde yirmi mail atarken tek bounce %5, Resend'in
 * eşiği %4.
 *
 * Terazi tersine döndü: "biraz sonra tekrar dene" kurtarılabilir, yakılmış
 * bir gönderim itibarı değil.
 *
 * ÖNBELLEĞE YAZILMIYOR: bu alan adı hakkında bir şey öğrenmedik, yalnız şu
 * an soramadık. Yazsaydık geçici bir arıza gerçek bir alan adını altı saat
 * kilitlerdi — bir sonraki test tam olarak bunu çiviliyor.
 */
test("DNS cevap vermezse ÇEVİRİYOR ve sebebi taşıyor", async () => {
  const dns: MxLookup = async () => {
    const e = new Error("timeout") as NodeJS.ErrnoException;
    e.code = "ETIMEOUT";
    throw e;
  };
  assert.deepEqual(await checkMailbox("kisi@a5.ornek", dns), {
    ok: false,
    reason: "unreachable",
    code: "ETIMEOUT",
  });
});

test("cevapsız sorgu ÖNBELLEĞE YAZILMIYOR", async () => {
  let ilk = true;
  const dns: MxLookup = async (domain) => {
    if (ilk) {
      ilk = false;
      const e = new Error("timeout") as NodeJS.ErrnoException;
      e.code = "ETIMEOUT";
      throw e;
    }
    return [{ exchange: `mx.${domain}` }];
  };
  const d = "kisi@a6.ornek";
  assert.equal((await checkMailbox(d, dns)).ok, false, "ilk sorgu patlıyor");
  /* İkinci deneme gerçekten yeniden soruyor — geçici arıza kilitlemiyor. */
  assert.deepEqual(await checkMailbox(d, dns), { ok: true });
});

test("@ yoksa eleniyor", async () => {
  const dns = kayitli({});
  assert.equal((await checkMailbox("aftersiz", dns)).ok, false);
});

test("alan adı büyük harfle yazılsa da tanınıyor", async () => {
  const dns = kayitli({ "a6.ornek": ["mx.a6.ornek"] });
  assert.deepEqual(await checkMailbox("Kisi@A6.TEST", dns), { ok: true });
});

/*
 * RFC 6761 ayrılmış uzantılar DNS'e sorulmadan geçiyor: kimseye satılamazlar,
 * gerçek kullanıcı yazmaz, ve duman testi kendi hesaplarını onlarla açıyor.
 */
test("ayrılmış test uzantıları DNS'e sorulmadan geçiyor", async () => {
  let soruldu = false;
  const dns: MxLookup = async () => {
    soruldu = true;
    return [];
  };
  assert.deepEqual(await checkMailbox("kisi@rung.test", dns), { ok: true });
  assert.deepEqual(await checkMailbox("kisi@a.invalid", dns), { ok: true });
  assert.equal(soruldu, false);
});
