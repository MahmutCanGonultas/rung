/*
 * Uçtan uca duman testi (smoke test).
 *
 * Gerçek bir tarayıcı açar, gerçek formları doldurur, gerçek veritabanına
 * yazar. Birim testi değil — "kritik akış hâlâ ayakta mı" sorusunun cevabı.
 *
 * Çalıştırma:  npm run smoke        (dev sunucusu ayrı bir terminalde açıkken)
 *              npm run smoke -- --base=https://rung-plum.vercel.app
 *
 * Kendi açtığı test hesabını sonunda siler.
 */

import puppeteer from "puppeteer-core";
import { Client } from "@neondatabase/serverless";

const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const baseArg = process.argv.find((a) => a.startsWith("--base="));
const BASE = baseArg ? baseArg.slice("--base=".length) : "http://localhost:3000";

const stamp = process.env.SMOKE_STAMP ?? String(process.hrtime.bigint());
const EMAIL = `smoke-${stamp}@rung.test`;
const PASSWORD = "duman-testi-9182";

let passed = 0;
const failures = [];
const extraAccounts = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/*
 * Sunucu yönlendirmesi bitene kadar bekle.
 *
 * `/write?...&skip=N` adresi sunucuda `redirect()` ile kalıcı adrese
 * gidiyor — iki hoplama var. `waitForNavigation` ilkini yakalayıp dönüyor,
 * ikincisi sırasında DOM değiştiği için hemen okumak boşa düşüyordu.
 */
async function waitForUrl(page, predicate, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (predicate(page.url())) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

/*
 * Öğeyi oku, olmazsa tekrar dene.
 *
 * Yönlendirme sırasında Puppeteer bazen eski belgeye bakıp "öğe yok" diyor.
 * Sayfa oturana kadar birkaç kez denemek, testin kendi yarışını çözüyor —
 * uygulamada bir sorun yok, ölçüm aracında var.
 */
async function readText(page, selector, tries = 20) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const value = await page.$eval(selector, (el) => el.textContent);
      if (value !== null) return value;
    } catch {
      /* henüz yok, tekrar dene */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

async function submitAuthForm(page, email, password) {
  await page.waitForSelector('input[name="email"]');
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  // Server Action + redirect bazen navigation olayı üretmez; sayfanın oturmasını bekle.
  await new Promise((r) => setTimeout(r, 600));
}

async function cleanUp() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const client = new Client(url);
  await client.connect();
  try {
    // sessions.user_id ON DELETE CASCADE — oturumlar da gider.
    const r = await client.query("DELETE FROM users WHERE email = ANY($1)", [
      [EMAIL, ...extraAccounts],
    ]);
    console.log(`\ntemizlik · silinen test hesabı: ${r.rowCount}`);
  } finally {
    await client.end();
  }
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(20000);

    console.log(`\ntemel adres: ${BASE}`);
    console.log(`test hesabı: ${EMAIL}\n`);

    console.log("1 · giriş yapmadan korumalı sayfa");
    await page.goto(`${BASE}/write`, { waitUntil: "networkidle0" });
    check(
      "/write → /login yönlendirmesi",
      page.url().includes("/login"),
      page.url()
    );

    console.log("\n2 · kayıt");
    await page.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
    await submitAuthForm(page, EMAIL, PASSWORD);
    check("kayıt sonrası /write", page.url().includes("/write"), page.url());
    check(
      "kabukta e-posta görünüyor",
      (await page.content()).includes(EMAIL)
    );

    const cookies = await browser.cookies();
    const session = cookies.find((c) => c.name === "rung_session");
    check("rung_session çerezi kuruldu", Boolean(session));
    check("çerez httpOnly", session?.httpOnly === true);
    check("çerez sameSite=Lax", session?.sameSite === "Lax", String(session?.sameSite));

    console.log("\n3 · aynı e-postayla tekrar kayıt");
    await page.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
    check(
      "giriş yapmışken /register → /write",
      page.url().includes("/write"),
      page.url()
    );

    console.log("\n4 · çıkış");
    await page.goto(`${BASE}/write`, { waitUntil: "networkidle0" });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}),
      page.click('form button[type="submit"]'),
    ]);
    await new Promise((r) => setTimeout(r, 600));
    check("çıkış sonrası anasayfa", new URL(page.url()).pathname === "/", page.url());
    const afterLogout = await browser.cookies();
    check(
      "oturum çerezi silindi",
      !afterLogout.some((c) => c.name === "rung_session" && c.value)
    );

    console.log("\n5 · çıkıştan sonra korumalı sayfa");
    await page.goto(`${BASE}/write`, { waitUntil: "networkidle0" });
    check("tekrar /login'e düşüyor", page.url().includes("/login"), page.url());

    console.log("\n6 · yanlış şifreyle giriş");
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
    await submitAuthForm(page, EMAIL, "kesinlikle-yanlis");
    check("hâlâ /login", page.url().includes("/login"), page.url());
    const errorText = await readText(page, '[role="alert"]', 6);
    check("hata mesajı gösteriliyor", Boolean(errorText), String(errorText));
    check(
      "mesaj hangi alanın yanlış olduğunu söylemiyor",
      errorText === "E-posta veya şifre hatalı.",
      String(errorText)
    );

    console.log("\n7 · doğru şifreyle giriş");
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
    await submitAuthForm(page, EMAIL, PASSWORD);
    check("giriş sonrası /write", page.url().includes("/write"), page.url());

    console.log("\n8 · zayıf şifreyle kayıt reddi");
    const page2 = await browser.createBrowserContext().then((c) => c.newPage());
    await page2.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
    await submitAuthForm(page2, `weak-${stamp}@rung.test`, "kisa");
    const weakError = await readText(page2, '[role="alert"]', 6);
    check("kısa şifre reddedildi", Boolean(weakError), String(weakError));
    check("hâlâ /register", page2.url().includes("/register"), page2.url());

    console.log("\n9 · Türkçe İ ile kayıt, küçük harfle giriş");
    /*
     * Regresyon testi. "İ".toLowerCase() tek harf değil "i" + U+0307 üretiyor;
     * düzeltilmeden önce telefonda otomatik büyük harfle kayıt olan biri
     * ertesi gün küçük harfle giriş yapamıyordu.
     */
    const trBase = `ismail-${stamp}@rung.test`;
    const trTyped = `İsmail-${stamp}@Rung.test`;
    const ctx = await browser.createBrowserContext();
    const page3 = await ctx.newPage();
    await page3.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
    await submitAuthForm(page3, trTyped, PASSWORD);
    check("İ'li adresle kayıt oldu", page3.url().includes("/write"), page3.url());

    await page3.goto(`${BASE}/write`, { waitUntil: "networkidle0" });
    check(
      "kayıt küçük harfli hâliyle saklandı",
      (await page3.content()).includes(trBase)
    );

    const ctx2 = await browser.createBrowserContext();
    const page4 = await ctx2.newPage();
    await page4.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
    await submitAuthForm(page4, trBase, PASSWORD);
    check(
      "küçük harfle giriş yapılabiliyor",
      page4.url().includes("/write"),
      page4.url()
    );
    extraAccounts.push(trBase);

    console.log("\n10 · bozuk e-posta reddi");
    await page2.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
    await submitAuthForm(page2, "bu-bir-eposta-degil", PASSWORD);
    const mailError = await readText(page2, '[role="alert"]', 6);
    check("bozuk e-posta reddedildi", Boolean(mailError), String(mailError));

    // ══════════ AŞAMA 02 · yazma, saklama, listeleme ══════════
    console.log("\n11 · yaz ekranı");
    await page.goto(`${BASE}/write`, { waitUntil: "networkidle0" });
    const writeUrl = new URL(page.url());
    check(
      "/write kendini kalıcı adrese yönlendiriyor",
      writeUrl.searchParams.has("context") && writeUrl.searchParams.has("task"),
      page.url()
    );

    const firstTask = await readText(page, ".task-title");
    check("görev gösteriliyor", Boolean(firstTask && firstTask.length > 5), String(firstTask));

    /*
     * Bağlam sayısı ile KİP sayısı ayrı. Jeton satırında beş bağlam ve bir de
     * "kendi konum" kipi var; ikisi aynı türden şey değil ve tek bir sayıyla
     * ölçülünce bu test kip eklendiğinde patlamıştı.
     */
    const contextCount = await page.$$eval(
      ".chips .chip:not(.is-own)",
      (els) => els.length
    );
    check("beş bağlam listeleniyor", contextCount === 5, `${contextCount} bağlam`);
    check("kendi konum kipi var", (await page.$$(".chip.is-own")).length === 1);

    console.log("\n12 · başka görev ver");
    /*
     * "Başka görev ver" bağlantısı /write?context=..&skip=.. adresine gidiyor,
     * orası da kalıcı adrese YÖNLENDİRİYOR. İki hoplama var, o yüzden
     * navigation olayını değil doğrudan öğeyi bekliyoruz.
     */
    /*
     * Adresin "task=" içermesini beklemek yetmiyor — tıklamadan ÖNCE de
     * içeriyordu, bekleme anında dönüyordu. Beklenecek şey adresin
     * DEĞİŞMESİ.
     */
    const beforeSwap = page.url();
    await page.click(".task-swap");
    const swapped = await waitForUrl(
      page,
      (u) => u !== beforeSwap && u.includes("task=")
    );
    check("başka görev adresi oturdu", swapped, `${beforeSwap} → ${page.url()}`);
    const secondTask = await readText(page, ".task-title");
    check("görev değişti", secondTask !== firstTask, `${firstTask} → ${secondTask}`);

    console.log("\n13 · kısa metin reddi");
    await page.waitForSelector(".composer button[type=submit]", { timeout: 15000 });
    await page.type(".editor", "too short");
    // DİKKAT: sayfadaki ilk submit düğmesi kabuktaki "Çıkış". Yazma alanının
    // düğmesi mutlaka `.composer` altından seçilmeli.
    const disabled = await page.$eval(
      ".composer button[type=submit]",
      (el) => el.disabled
    );
    check("on kelimenin altında kaydet kapalı", disabled === true);

    console.log("\n14 · kayıt kaydetme");
    const BODY =
      "I am writing to ask about the deposit for the flat that I rented last year. " +
      "The agreement said the money would be returned within thirty days, but nothing " +
      "has arrived yet and nobody answers the office phone. Could you please tell me " +
      "when the transfer will be made, and to which account it will be sent.";
    await page.$eval(".editor", (el) => { el.value = ""; });
    await page.type(".editor", BODY);
    const shownWords = await readText(page, ".composer-count b");
    check(
      "kelime sayacı doğru",
      Number(shownWords) === BODY.trim().split(/\s+/).length,
      `sayaç ${shownWords}, gerçek ${BODY.trim().split(/\s+/).length}`
    );

    await page.click(".composer button[type=submit]");
    await waitForUrl(page, (u) => /\/entries\/\d+$/.test(u), 20000);
    await new Promise((r) => setTimeout(r, 500));
    const entryUrl = page.url();
    check("kaydettikten sonra kayıt sayfası", /\/entries\/\d+$/.test(entryUrl), entryUrl);
    const entryId = entryUrl.split("/").pop();

    const entryText = await page.content();
    check("metin olduğu gibi duruyor", entryText.includes("thirty days"));

    console.log("\n15 · geçmiş");
    await page.goto(`${BASE}/history`, { waitUntil: "networkidle0" });
    /*
     * KAYDIN KENDİSİ aranıyor, metninden bir kelime değil.
     *
     * Buraya "deposit" geçiyor mu diye bakılıyordu ve o kelime listede yalnızca
     * GÖREVİN metninde bulunabiliyor — görev ise havuzdan RASTGELE seçiliyor.
     * Yani test yıllardır kura tutturduğu için geçiyordu; havuz büyüyünce
     * kaldı. Ölçmek istediği şey "yazdığım kayıt listede mi", o da kimliğiyle
     * ölçülüyor.
     */
    const listeDe = await page.$$eval("a.entry-row", (els) =>
      els.map((el) => el.getAttribute("href"))
    );
    check(
      "kayıt listede",
      listeDe.includes(`/entries/${entryId}`),
      listeDe.join(", ")
    );
    const rows = await page.$$eval(".entry-row", (els) => els.length);
    check("bir satır var", rows === 1, `${rows} satır`);

    console.log("\n16 · arama");
    await page.goto(`${BASE}/history?q=deposit`, { waitUntil: "networkidle0" });
    check("eşleşen arama sonuç veriyor", (await page.$$(".entry-row")).length === 1);
    await page.goto(`${BASE}/history?q=elephants`, { waitUntil: "networkidle0" });
    check("eşleşmeyen arama boş", (await page.$$(".entry-row")).length === 0);
    await page.goto(`${BASE}/history?q=agreements`, { waitUntil: "networkidle0" });
    check(
      "arama kök buluyor (agreements → agreement)",
      (await page.$$(".entry-row")).length === 1
    );

    console.log("\n17 · bağlama göre süzme");
    await page.goto(`${BASE}/history?context=technical`, { waitUntil: "networkidle0" });
    check("başka bağlamda kayıt yok", (await page.$$(".entry-row")).length === 0);

    console.log("\n18 · SAHİPLİK — başkasının kaydı görünmemeli");
    const otherEmail = `other-${stamp}@rung.test`;
    const otherCtx = await browser.createBrowserContext();
    const otherPage = await otherCtx.newPage();
    await otherPage.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
    await submitAuthForm(otherPage, otherEmail, PASSWORD);
    check("ikinci hesap açıldı", otherPage.url().includes("/write"), otherPage.url());
    extraAccounts.push(otherEmail);

    const stolen = await otherPage.goto(`${BASE}/entries/${entryId}`, {
      waitUntil: "networkidle0",
    });
    check(
      "başkasının kaydı 404 dönüyor",
      stolen?.status() === 404,
      `HTTP ${stolen?.status()}`
    );
    check(
      "kaydın metni sızmıyor",
      !(await otherPage.content()).includes("thirty days")
    );

    await otherPage.goto(`${BASE}/history`, { waitUntil: "networkidle0" });
    check(
      "ikinci hesabın geçmişi boş",
      (await otherPage.$$(".entry-row")).length === 0
    );

    console.log("\n19 · olmayan ve bozuk kayıt kimlikleri");
    const missing = await page.goto(`${BASE}/entries/99999999`, {
      waitUntil: "networkidle0",
    });
    check("olmayan kayıt 404", missing?.status() === 404, `HTTP ${missing?.status()}`);
    const junk = await page.goto(`${BASE}/entries/abc`, { waitUntil: "networkidle0" });
    check("sayı olmayan kimlik 404 (çökme değil)", junk?.status() === 404, `HTTP ${junk?.status()}`);

    console.log("\n20 · giriş yapmadan yazma ekranı");
    const anonCtx = await browser.createBrowserContext();
    const anonPage = await anonCtx.newPage();
    await anonPage.goto(`${BASE}/write`, { waitUntil: "networkidle0" });
    check("/write → /login", anonPage.url().includes("/login"), anonPage.url());
    await anonPage.goto(`${BASE}/history`, { waitUntil: "networkidle0" });
    check("/history → /login", anonPage.url().includes("/login"), anonPage.url());

    // ══════════ AŞAMA 03 · deterministik analiz (K0) ══════════
    console.log("\n21 · K0 şeridi ve bulgular");
    await page.goto(entryUrl, { waitUntil: "networkidle0" });
    /*
     * Ham ölçüler artık ekranın üstünde bir şerit değil, "Ölçüm ayrıntısı"
     * katlanır kutusunun içinde. `<details>` kapalıyken de DOM'da duruyor —
     * `display: none` ile gizlenmiş bir şey değil, açılmamış bir çekmece.
     */
    const olcu = await readText(page, ".read-detail .pairs");
    check("ham ölçüler okunabiliyor", Boolean(olcu && olcu.includes("kelime")), String(olcu).slice(0, 60));
    check("kelime bandı çubuğu var", (await page.$$(".bands-slice")).length > 0);
    /*
     * Sayılan şey KURAL katmanının bulguları.
     *
     * Kayıt sayfası açılınca model katmanı artık KENDİLİĞİNDEN koşuyor ve
     * yoruma dayalı bir bulgu üretebiliyor — bu testin ölçmek istediği şey
     * o değil: deterministik katman temiz bir cümlede susmalı. Satırın
     * künyesi hangi katmanın ürettiğini yazıyor, sayım oradan.
     */
    const kuralBulgulari = await page.$$eval(".fix-src", (els) =>
      els.filter((el) => (el.textContent ?? "").startsWith("kural")).length
    );
    check(
      "temiz metinde kural katmanı susuyor",
      kuralBulgulari === 0,
      `${kuralBulgulari} kural bulgusu`
    );

    console.log("\n22 · hatalı metin gerçekten bulgu üretiyor");
    await page.goto(`${BASE}/write`, { waitUntil: "networkidle0" });
    await page.waitForSelector(".composer button[type=submit]", { timeout: 15000 });
    const BAD =
      "i am agree with your suggestion about the meeting of tomorrow. " +
      "Thanks for the informations you sent me , i recieved them yesterday. " +
      "We should discuss about the the details when you are free next week.";
    await page.type(".editor", BAD);
    await page.click(".composer button[type=submit]");
    await waitForUrl(page, (u) => /\/entries\/\d+$/.test(u) && u !== entryUrl, 20000);
    await new Promise((r) => setTimeout(r, 600));

    const kinds = await page.$$eval(".fix-kind", (els) =>
      els.map((el) => el.textContent ?? "")
    );
    const joined = kinds.join(" | ");
    check("bulgu üretildi", kinds.length >= 6, `${kinds.length} bulgu`);
    check("Türkçe kaynaklı kalıp yakalandı", /Türkçe kaynaklı/.test(joined), joined);
    check("sayılabilirlik yakalandı", /Sayılabilirlik|sayılabilirlik/i.test(joined), joined);
    check("yazım hatası yakalandı", /Yazım|yazım/.test(joined), joined);
    check("tekrar yakalandı", /tekrar/i.test(joined), joined);

    const marks = await page.$$eval(".read-mark", (els) => els.length);
    check("metinde işaretler var", marks >= 6, `${marks} işaret`);

    const suggestions = await page.$$eval(".fix-now", (els) =>
      els.map((el) => el.textContent)
    );
    check("düzeltme önerisi veriliyor", suggestions.includes("I agree"), suggestions.join(", "));

    // ══════════ ERİŞİLEBİLİRLİK ══════════
    // ══════════ YENİ DAVRANIŞLAR ══════════
    console.log("\n22b · hiç yazmadan seviye gösterilmiyor");
    /*
     * Hiç kaydı olmayan bir hesapta seviye cetvelinde hiçbir bant YANMAMALI.
     * Önceki hâli `currentLevel()` okuyordu ve o, ölçüm bulamayınca varsayılana
     * (B1) düşüyor: yeni kullanıcı kendi seviyesi olarak uydurulmuş bir bant
     * görüyordu. Ürünün tek cümlelik kimliği tam olarak bunu yapmamak.
     */
    const yeniCtx = await browser.createBrowserContext();
    const yeniPage = await yeniCtx.newPage();
    const yeniMail = `taze-${stamp}@rung.test`;
    await yeniPage.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
    await submitAuthForm(yeniPage, yeniMail, PASSWORD);
    extraAccounts.push(yeniMail);
    const yanan = await yeniPage.$$eval(".rule-step.is-on", (els) => els.length);
    check("kayıtsız hesapta hiçbir bant yanmıyor", yanan === 0, `${yanan} yanan bant`);
    const cetvelNot = await readText(yeniPage, ".rule-none", 4);
    check("neden ölçülmediği yazıyor", Boolean(cetvelNot), String(cetvelNot));

    console.log("\n22c · kendi konusunda yazma");
    /*
     * Görevsiz kayıt: `?context=own` görev vermiyor, kaydetme eylemi boş
     * `taskId` ile "Serbest" bağlamına yazıyor ve ölçüm zinciri aynı çalışıyor.
     */
    await yeniPage.goto(`${BASE}/write?context=own`, { waitUntil: "networkidle0" });
    await yeniPage.waitForSelector(".composer button[type=submit]", { timeout: 15000 });
    check(
      "kendi konusunda görev verilmiyor",
      (await yeniPage.$$(".task-swap")).length === 0
    );
    await yeniPage.type(
      ".editor",
      "Yesterday i have wrote a email to my landlord about the deposit. " +
        "He didnt answered me and i am agree with my friend that this is not normal."
    );
    await yeniPage.click(".composer button[type=submit]");
    const serbestOk = await waitForUrl(
      yeniPage,
      (u) => /\/entries\/\d+$/.test(u),
      20000
    );
    check("görevsiz metin kaydedildi", serbestOk, yeniPage.url());
    await new Promise((r) => setTimeout(r, 800));
    const serbestBaslik = await readText(yeniPage, ".read-task", 6);
    check(
      "kayıt serbest yazı olarak açılıyor",
      String(serbestBaslik).includes("Serbest"),
      String(serbestBaslik)
    );
    const serbestBulgu = await yeniPage.$$eval(".fix", (els) => els.length);
    check("görevsiz metinde de bulgu üretiliyor", serbestBulgu > 0, `${serbestBulgu} bulgu`);
    const yananSonra = await yeniPage.$$eval(".rule-step.is-on", (els) => els.length);
    check("ilk kayıttan sonra seviye ölçülüyor", yananSonra === 1, `${yananSonra} yanan bant`);
    await yeniCtx.close();

    console.log("\n23 · erişilebilirlik");
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });

    // Atlama bağlantısı: odaklanmadan gizli, odaklanınca görünür.
    /*
     * Şart: bağlantı ekranın DIŞINDA olsun. Hangi eksende olduğu bir
     * uygulama ayrıntısı — eski stil sayfası sola, yenisi yukarı atıyor ve
     * ikisi de aynı erişilebilirlik kuralını karşılıyor. Test kuralı
     * ölçüyor, uygulamayı değil.
     */
    const skipHidden = await page.$eval(".skip", (el) => {
      const r = el.getBoundingClientRect();
      return r.bottom < 0 || r.right < 0 || r.top > window.innerHeight || r.left > window.innerWidth;
    });
    check("atlama bağlantısı normalde gizli", skipHidden);
    await page.keyboard.press("Tab");
    const skipShown = await page.$eval(".skip", (el) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight;
    });
    check("ilk Tab'da atlama bağlantısı görünüyor", skipShown);

    // Her form alanının erişilebilir bir adı olmalı.
    const unnamed = await page.$$eval("input, select, textarea", (els) =>
      els
        .filter((el) => {
          if (el.type === "hidden") return false;
          const byLabel = el.closest("label") !== null;
          const byAria = el.getAttribute("aria-label") !== null;
          const byId = el.id && document.querySelector(`label[for="${el.id}"]`);
          return !byLabel && !byAria && !byId;
        })
        .map((el) => el.getAttribute("name") ?? el.tagName)
    );
    check("her alanın erişilebilir adı var", unnamed.length === 0, unnamed.join(", "));

    // Klavyeyle gönderme düğmesine ulaşılabilmeli.
    const reachable = await page.evaluate(() => {
      const focusable = document.querySelectorAll(
        'a[href], button, input:not([type=hidden]), select, textarea'
      );
      return [...focusable].some((el) => el.matches('button[type="submit"]'));
    });
    check("gönder düğmesi klavye sırasında", reachable);

    // Başlık düzeni: h1 var ve tek.
    const headings = await page.$$eval("h1", (els) => els.length);
    check("sayfada tam bir h1 var", headings === 1, `${headings} tane`);

    // Sayfa dili ve İngilizce içeriğin işaretlenmesi.
    await page.goto(`${BASE}/write`, { waitUntil: "networkidle0" });
    await page.waitForSelector(".editor", { timeout: 15000 });
    const htmlLang = await page.$eval("html", (el) => el.lang);
    check("sayfa dili tr", htmlLang === "tr", htmlLang);
    const taskLang = await page.$eval(".task-title", (el) => el.lang);
    check("İngilizce görev metni lang=en ile işaretli", taskLang === "en", taskLang);
    const editorLang = await page.$eval(".editor", (el) => el.lang);
    check("yazma alanı lang=en", editorLang === "en", editorLang);
  } finally {
    await browser.close();
    await cleanUp();
  }

  console.log(`\n${passed} geçti · ${failures.length} kaldı`);
  if (failures.length > 0) {
    failures.forEach((f) => console.log(`  ✗ ${f}`));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("\nduman testi çöktü:", error);
  process.exitCode = 1;
});
