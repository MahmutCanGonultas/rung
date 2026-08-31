/*
 * Uçtan uca duman testi (smoke test).
 *
 * Gerçek bir tarayıcı açar, gerçek formları doldurur, gerçek veritabanına
 * yazar. Birim testi değil — "kritik akış hâlâ ayakta mı" sorusunun cevabı.
 *
 * Çalıştırma:  npm run smoke        (dev sunucusu ayrı bir terminalde açıkken)
 *              npm run smoke -- --base=https://www.rungscale.com
 *
 * CANLIYA KARŞI KOŞMADAN ÖNCE OKU: kayıt artık gerçek mail gönderiyor.
 * Bu takım her koşumda altı civarı hesap açıyor ve adresleri `@rung.test` —
 * yani gönderilen her mail HARD BOUNCE üretiyor. Yeni bir gönderim alan
 * adında bounce oranı itibarı doğrudan düşürüyor. Canlıya karşı koşmak,
 * teslim edilebilirliği ölçmek isterken bozmak demek.
 *
 * Kendi açtığı test hesabını sonunda siler.
 */

import { createHash, randomBytes } from "node:crypto";

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
  /*
   * Yönlendirme BEKLENİYOR AMA ŞART DEĞİL. Hatalı girdi yönlendirme üretmiyor
   * ve varsayılan yirmi saniyelik zaman aşımı her hata denemesine yirmi saniye
   * ekliyordu — takım on dakikayı buluyordu. Sekiz saniye, sunucu eylemi +
   * bcrypt + yönlendirme için fazlasıyla yeterli.
   */
  await Promise.all([
    page
      .waitForNavigation({ waitUntil: "networkidle0", timeout: 8000 })
      .catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  // Server Action + redirect bazen navigation olayı üretmez; sayfanın oturmasını bekle.
  await new Promise((r) => setTimeout(r, 600));
}

/*
 * KAYIT ARTIK İKİ ADIM — ve duman testi ikisini de yürüyor.
 *
 * Form hesap AÇMIYOR: bekleyen bir kayıt yazıp posta kutusuna bağlantı
 * yolluyor. Test bir posta kutusu okuyamıyor, ama veritabanını okuyabiliyor.
 *
 * NEDEN JETONU YENİDEN YAZIYORUZ, OKUMUYORUZ: tabloda jetonun kendisi değil
 * SHA-256 özeti duruyor — okunacak bir şey yok, özetten jeton çıkmıyor. Test
 * kendi jetonunu üretip özetini satıra yazıyor; satırın geri kalanı
 * (adres, bcrypt'li şifre, son kullanma) uygulamanın yazdığı gerçek satır.
 *
 * NEDEN SUNUCU GÜNLÜĞÜNÜ OKUMUYORUZ: `sendMail` anahtar yokken bağlantıyı
 * konsola yazıyor, ama o konsol başka bir terminalde — ve bu test canlıya
 * karşı da koşabiliyor. Veritabanı iki durumda da erişilebilir tek yer.
 */
/*
 * `storedAs`: formda yazılan adres ile satıra düşen adres AYRI olabiliyor —
 * `İsmail@Rung.test` küçültülüp `ismail@rung.test` olarak saklanıyor. Bekleyen
 * kaydı saklanan hâliyle arıyoruz.
 */
async function signupThrough(page, email, password, storedAs = email) {
  await page.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
  await submitAuthForm(page, email, password);

  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token, "utf8").digest("hex");
  const r = await ask(
    "UPDATE pending_signups SET token_hash = $1 WHERE email = $2",
    [hash, storedAs]
  );
  if (r.rowCount !== 1) {
    throw new Error(
      `bekleyen kayıt yazılmadı (${storedAs}) — satır sayısı ${r.rowCount}`
    );
  }

  await openVerifyLink(page, token);
}

/*
 * Doğrulama bağlantısı ÜÇ hoplama yapıyor: `/verify` → `/write` → `/write`in
 * kalıcı adresi. `networkidle0` bu zincirde geliştirme sunucusunun HMR
 * soketiyle birlikte zaman aşımına düşüyordu — uygulamada değil, ölçüm
 * aracında bir sorun. Belge yüklenmesini bekleyip adresin oturmasını ayrıca
 * kolluyoruz.
 */
async function openVerifyLink(page, token) {
  await page.goto(`${BASE}/verify?t=${token}`, { waitUntil: "domcontentloaded" });
  await waitForUrl(page, (u) => !u.includes("/verify"));
  await new Promise((rr) => setTimeout(rr, 400));
}

/*
 * HER SORGU İÇİN YENİ BAĞLANTI — bilerek.
 *
 * Önce tek bir uzun ömürlü `Client` tutuluyordu. ÖLÇÜLDÜ ve süreci çökertti:
 * Neon'un WebSocket'i dakikalarca boşta kalınca kapanıyor, sürücü `error`
 * olayı yayıyor ve o olayın dinleyicisi olmadığı için Node bütün süreci
 * düşürüyor — duman testi ürünle ilgisi olmayan bir sebeple ölüyordu.
 *
 * Bağlantı açmak birkaç yüz milisaniye; bu testte önemsiz.
 */
async function ask(sql, params) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL yok — kayıt akışı sınanamıyor");
  const client = new Client(url);
  /* Kapanan sokete kimse bakmazsa süreç düşüyor. */
  client.on("error", () => {});
  await client.connect();
  try {
    return await client.query(sql, params);
  } finally {
    await client.end().catch(() => {});
  }
}

async function cleanUp() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const client = new Client(url);
  client.on("error", () => {});
  await client.connect();
  const all = [EMAIL, ...extraAccounts];
  try {
    // sessions.user_id ON DELETE CASCADE — oturumlar da gider.
    const r = await client.query("DELETE FROM users WHERE email = ANY($1)", [all]);
    /* Tıklanmadan kalmış bekleyen kayıtlar da gitsin: içlerinde şifre özeti var. */
    await client.query("DELETE FROM pending_signups WHERE email = ANY($1)", [all]);
    console.log(`\ntemizlik · silinen test hesabı: ${r.rowCount}`);
  } finally {
    await client.end().catch(() => {});
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
    /*
     * Kırk beş saniye. Geliştirme sunucusu bir sayfayı İLK istekte derliyor ve
     * `networkidle0` HMR soketiyle birlikte yirmi saniyeyi aşabiliyor — ölçüm
     * aracının kendi zaman aşımı yüzünden kırmızı yanan bir takım, ölçtüğü şey
     * hakkında hiçbir şey söylemiyor.
     */
    page.setDefaultTimeout(45000);

    /*
     * IP KOVALARI TEMİZLENİYOR — kendi ön koşulumuz.
     *
     * Bu takım her koşumda sekiz civarı hesap açıyor ve hepsi AYNI IP'den
     * geliyor. Kayıt yolunda IP başına saatte otuz sınırı var; iki-üç koşum
     * üst üste yapılınca sınır devreye giriyor ve kayıt SESSİZCE düşüyor —
     * sessiz, çünkü "çok denedin" demek "bu adres kayıtlı" demenin dolaylı
     * yolu olurdu. Yani ürün doğru davranıyor, testin ön koşulu yanlıştı:
     * ÖLÇÜLDÜ, kovada otuz kayıt vardı ve bekleyen kayıt hiç yazılmıyordu.
     *
     * YALNIZ IP KOVALARI siliniyor. Adres başına kovalara dokunulmuyor —
     * onlar gerçek davranışın parçası ve bir gün sınanacaklar.
     */
    await ask(
      "DELETE FROM auth_attempts WHERE bucket LIKE 'signup-ip:%' OR bucket LIKE 'code-ip:%'"
    ).catch(() => {});

    console.log(`\ntemel adres: ${BASE}`);
    console.log(`test hesabı: ${EMAIL}\n`);

    console.log("1 · giriş yapmadan korumalı sayfa");
    await page.goto(`${BASE}/write`, { waitUntil: "networkidle0" });
    check(
      "/write → /login yönlendirmesi",
      page.url().includes("/login"),
      page.url()
    );

    console.log("\n2 · kayıt — hesap bağlantıya tıklayınca açılıyor");
    await page.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
    await submitAuthForm(page, EMAIL, PASSWORD);
    check(
      "form 'kutuna bak' ekranına döndü",
      (await page.$$(".recover-done")).length === 1,
      page.url()
    );
    check(
      "form daha oturum açmadı",
      !(await browser.cookies()).some((c) => c.name === "rung_session" && c.value)
    );
    /*
     * ASIL KONTROL: form tek başına HESAP AÇMIYOR. Bu satır düşerse ürün
     * sessizce eski davranışına dönmüş demektir — doğrulanmamış hesaplar
     * yine birikiyor.
     */
    const beforeClick = await ask("SELECT 1 FROM users WHERE email = $1", [EMAIL]);
    check("bağlantıdan önce hesap YOK", beforeClick.rowCount === 0);

    const token0 = randomBytes(32).toString("base64url");
    const reKey = await ask(
      "UPDATE pending_signups SET token_hash = $1 WHERE email = $2",
      [createHash("sha256").update(token0, "utf8").digest("hex"), EMAIL]
    );
    check("bekleyen kayıt yazıldı", reKey.rowCount === 1);

    await openVerifyLink(page, token0);
    check("bağlantı sonrası /write", page.url().includes("/write"), page.url());
    check(
      "adres doğrulanmış açıldı — uyarı şeridi yok",
      (await page.$$(".verify")).length === 0
    );
    /* Jeton tek kullanımlık: aynı bağlantı ikinci kez hesap açmıyor. */
    const ikinciCtx = await browser.createBrowserContext();
    const ikinciPage = await ikinciCtx.newPage();
    await openVerifyLink(ikinciPage, token0);
    check(
      "aynı bağlantı ikinci kez çalışmıyor",
      ikinciPage.url().includes("/login"),
      ikinciPage.url()
    );
    await ikinciCtx.close();
    check(
      "kabukta e-posta görünüyor",
      (await page.content()).includes(EMAIL)
    );

    const cookies = await browser.cookies();
    const session = cookies.find((c) => c.name === "rung_session");
    check("rung_session çerezi kuruldu", Boolean(session));
    check("çerez httpOnly", session?.httpOnly === true);
    check("çerez sameSite=Lax", session?.sameSite === "Lax", String(session?.sameSite));

    console.log("\n2b · KODLA hesap açma — mail spam'e düştüğünde kalan yol");
    /*
     * Gönderim alan adı yeni ve Outlook doğrulama mailini gereksiz klasörüne
     * koydu (ölçüldü). İtibar zamanla oluşuyor; o süre boyunca bağlantı tek
     * yol olsaydı ürün çalışmıyor olurdu. Kod aynı yere çıkıyor ve burada
     * gerçekten çıktığı ölçülüyor.
     */
    const kodCtx = await browser.createBrowserContext();
    const kodPage = await kodCtx.newPage();
    const kodMail = `kod-${stamp}@rung.test`;
    extraAccounts.push(kodMail);

    await kodPage.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
    await submitAuthForm(kodPage, kodMail, PASSWORD);
    check("kod kutusu ekranda", (await kodPage.$$("#code")).length === 1);

    /* Kodu veritabanından okuyoruz — posta kutusu okuyamıyoruz. */
    const kodSatir = await ask(
      "SELECT code FROM pending_signups WHERE email = $1",
      [kodMail]
    );
    const kod = kodSatir.rows[0]?.code;
    check("altı haneli kod üretildi", /^\d{6}$/.test(String(kod)), String(kod));

    /* Önce YANLIŞ kod: reddedilmeli ve kalan hak söylenmeli. */
    const yanlisKod = kod === "000000" ? "111111" : "000000";
    await kodPage.type("#code", yanlisKod);
    await Promise.all([
      kodPage.waitForNavigation({ waitUntil: "networkidle0", timeout: 8000 }).catch(() => {}),
      kodPage.click(".codebox button[type=submit]"),
    ]);
    await new Promise((r) => setTimeout(r, 900));
    const kodHata = await readText(kodPage, ".codebox .form-error", 8);
    check(
      "yanlış kod reddedildi ve kalan hak yazıyor",
      Boolean(kodHata) && /hakkın kaldı/i.test(String(kodHata)),
      String(kodHata).slice(0, 50)
    );
    const halaYok = await ask("SELECT 1 FROM users WHERE email = $1", [kodMail]);
    check("yanlış koddan sonra hâlâ hesap YOK", halaYok.rowCount === 0);

    /* Sonra DOĞRU kod. */
    await kodPage.$eval("#code", (el) => { el.value = ""; });
    await kodPage.type("#code", String(kod));
    await Promise.all([
      kodPage.waitForNavigation({ waitUntil: "networkidle0", timeout: 12000 }).catch(() => {}),
      kodPage.click(".codebox button[type=submit]"),
    ]);
    await waitForUrl(kodPage, (u) => u.includes("/write"), 15000);
    check("doğru kodla hesap açıldı", kodPage.url().includes("/write"), kodPage.url());
    const kodHesap = await ask(
      "SELECT email_verified_at IS NOT NULL v FROM users WHERE email = $1",
      [kodMail]
    );
    check("kodla açılan hesap DOĞRULANMIŞ", kodHesap.rows[0]?.v === true);

    /* Kod TEK KULLANIMLIK: aynı kod ikinci kez hesap açmamalı. */
    const kalanKayit = await ask(
      "SELECT 1 FROM pending_signups WHERE email = $1",
      [kodMail]
    );
    check("bekleyen kayıt tüketildi", kalanKayit.rowCount === 0);
    await kodCtx.close();

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
    await signupThrough(page3, trTyped, PASSWORD, trBase);
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

    console.log("\n9b · adresin gerçekten posta alıp almadığı");
    /*
     * Kayıtta bir ELEK var: alan adı posta almıyorsa hesap açılmıyor.
     * `hotmial.com` ve `outlok.com` GERÇEKTEN kayıtlı alan adları ve A
     * kayıtları var — ama MX kayıtları YOK. Elek RFC 5321'i izleyip A kaydına
     * düşseydi ikisini de geçirirdi; ÖLÇÜLDÜ ve öyle oluyordu.
     *
     * Bu kontrol AĞA ÇIKIYOR. Ağ yoksa atlanıyor: duman testi bir DNS
     * arızası yüzünden kırmızı yanmasın.
     */
    const agVar = await page
      .evaluate(() => fetch("https://dns.google/resolve?name=gmail.com&type=MX").then((r) => r.ok))
      .catch(() => false);

    if (agVar) {
      const elekCtx = await browser.createBrowserContext();
      const elekPage = await elekCtx.newPage();
      await elekPage.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
      await submitAuthForm(elekPage, `kisi-${stamp}@hotmial.com`, PASSWORD);
      /*
       * Bol deneme: sunucu bu isteği milisaniyelerde reddediyor (elek DNS
       * cevabını önbellekliyor) ama React'in hatayı çizmesi ilk gönderimde
       * gecikebiliyor. ÖLÇÜLDÜ — aynı blokta ikinci kontrol geçerken birincisi
       * düşüyordu. Ürünün değil, ölçüm aracının yarışı.
       */
      const elekHata = await readText(elekPage, '[role="alert"]', 16);
      check(
        "posta almayan alan adı reddedildi",
        Boolean(elekHata) && elekPage.url().includes("/register"),
        String(elekHata).slice(0, 60)
      );

      await elekPage.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
      await submitAuthForm(elekPage, `kisi-${stamp}@mailinator.com`, PASSWORD);
      const gecici = await readText(elekPage, '[role="alert"]', 16);
      check(
        "tek kullanımlık adres reddedildi",
        Boolean(gecici) && /geçici/i.test(String(gecici)),
        String(gecici).slice(0, 60)
      );
      await elekCtx.close();
    } else {
      console.log("  · ağ yok, elek kontrolü atlandı");
    }

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

    const yazmaAdresi = page.url();
    await page.click(".composer button[type=submit]");
    await waitForUrl(page, (u) => /\/entries\/\d+$/.test(u), 20000);
    await new Promise((r) => setTimeout(r, 500));
    const entryUrl = page.url();
    check("kaydettikten sonra kayıt sayfası", /\/entries\/\d+$/.test(entryUrl), entryUrl);
    const entryId = entryUrl.split("/").pop();

    const entryText = await page.content();
    check("metin olduğu gibi duruyor", entryText.includes("thirty days"));

    console.log("\n14b · aynı görevi ikinci kez yazmak");
    /*
     * REGRESYON. Ayrıntı sayfası aynı görevin ÖNCEKİ denemelerini listeliyor
     * ve o liste satırı kişinin kendi cümlesini gösteriyor. Satırı besleyen
     * sorgu `snippet` sütununu seçmiyordu: sayfanın tamamı hata sınırına
     * düşüyordu ve hiçbir test görmüyordu, çünkü buraya kadar her görev
     * yalnızca BİR kez yazılıyordu. Koyu tema ekran görüntüsünde yakalandı.
     */
    const IKINCI =
      "Last month I wrote to you about the same deposit and nobody answered me. " +
      "I am writing again because the money has still not arrived in my account, " +
      "and the office phone rings without an answer every single morning I try.";
    await page.goto(yazmaAdresi, { waitUntil: "networkidle0" });
    await page.waitForSelector(".composer button[type=submit]", { timeout: 20000 });
    await page.$eval(".editor", (el) => { el.value = ""; });
    await page.type(".editor", IKINCI);
    await page.click(".composer button[type=submit]");
    await waitForUrl(page, (u) => /\/entries\/\d+$/.test(u) && u !== entryUrl, 25000);

    await page.goto(entryUrl, { waitUntil: "networkidle0" });
    const oncekiler = await page.$$eval(".earlier .entry-row .entry-snippet", (els) =>
      els.map((el) => el.textContent.trim())
    );
    check(
      "önceki deneme listeleniyor",
      oncekiler.length === 1,
      `${oncekiler.length} satır`
    );
    check(
      "önceki denemenin kendi cümlesi yazıyor",
      Boolean(oncekiler[0]) && oncekiler[0].startsWith("Last month"),
      String(oncekiler[0]).slice(0, 40)
    );

    console.log("\n14c · günlük ölçüm hakkı");
    /*
     * Her kayıt bir model çağrısı, yani gerçek bir bedel. Sınır SUNUCUDA:
     * ekranın düğmeyi kapatması bir sınır değil, form tarayıcısız da
     * gönderilebiliyor. Bu adım ikisini de ölçüyor.
     *
     * Bu hesap yukarıda iki kayıt yazdı, yani üçüncü geçmeli, dördüncü
     * reddedilmeli.
     */
    await page.goto(yazmaAdresi, { waitUntil: "networkidle0" });
    await page.waitForSelector(".composer-quota", { timeout: 20000 });
    const kalanMetin = await readText(page, ".composer-quota", 6);
    check(
      "kalan hak ekranda yazıyor",
      /1 ölçüm hakkın kaldı/.test(String(kalanMetin)),
      String(kalanMetin)
    );

    const UCUNCU =
      "The shop told me the delivery would arrive on Tuesday but nothing came. " +
      "I called them twice and nobody could tell me where my parcel is now, " +
      "so I would like to know when it will be sent or when I get my money back.";
    await page.$eval(".editor", (el) => { el.value = ""; });
    await page.type(".editor", UCUNCU);
    await page.click(".composer button[type=submit]");
    await waitForUrl(page, (u) => /\/entries\/\d+$/.test(u), 25000);
    check("üçüncü kayıt geçti", /\/entries\/\d+$/.test(page.url()), page.url());

    /* Dördüncü: ekran kapalı olmalı VE sunucu reddetmeli. */
    await page.goto(yazmaAdresi, { waitUntil: "networkidle0" });
    await page.waitForSelector(".composer-quota", { timeout: 20000 });
    const doldu = await readText(page, ".composer-quota", 6);
    check("hak dolduğu yazıyor", /doldu/.test(String(doldu)), String(doldu));
    const kapali = await page.$eval(
      ".composer button[type=submit]",
      (el) => el.disabled
    );
    check("kaydet düğmesi kapandı", kapali === true);

    /*
     * ASIL KONTROL: düğmeyi elle açıp gönderiyoruz. Ekranın kapatması bir
     * sınır değil; sunucu reddetmezse sınır diye bir şey yok demektir.
     */
    await page.$eval(".editor", (el) => { el.value = ""; });
    await page.type(".editor", UCUNCU);
    await page.$eval(".composer button[type=submit]", (el) => { el.disabled = false; });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 8000 }).catch(() => {}),
      page.click(".composer button[type=submit]"),
    ]);
    await new Promise((r) => setTimeout(r, 1200));
    const sinirHata = await readText(page, ".composer .form-error", 10);
    check(
      "SUNUCU dördüncü kaydı reddetti",
      Boolean(sinirHata) && /hakkın doldu/i.test(String(sinirHata)),
      String(sinirHata).slice(0, 60)
    );
    const kayitSayisi = await ask(
      "SELECT count(*)::int n FROM entries WHERE user_id = (SELECT id FROM users WHERE email = $1)",
      [EMAIL]
    );
    check(
      "veritabanında üç kayıt var, dört değil",
      kayitSayisi.rows[0].n === 3,
      `${kayitSayisi.rows[0].n} kayıt`
    );

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
    check("üç satır var", rows === 3, `${rows} satır`);

    console.log("\n16 · arama");
    await page.goto(`${BASE}/history?q=deposit`, { waitUntil: "networkidle0" });
    check("eşleşen arama sonuç veriyor", (await page.$$(".entry-row")).length === 2);
    await page.goto(`${BASE}/history?q=elephants`, { waitUntil: "networkidle0" });
    check("eşleşmeyen arama boş", (await page.$$(".entry-row")).length === 0);
    await page.goto(`${BASE}/history?q=agreements`, { waitUntil: "networkidle0" });
    check(
      "arama kök buluyor (agreements → agreement)",
      (await page.$$(".entry-row")).length === 1
    );
    await page.goto(`${BASE}/history?q=mornings`, { waitUntil: "networkidle0" });
    check(
      "ikinci kayıt da aranabiliyor (mornings → morning)",
      (await page.$$(".entry-row")).length === 1
    );

    console.log("\n17 · bağlama göre süzme");
    await page.goto(`${BASE}/history?context=technical`, { waitUntil: "networkidle0" });
    check("başka bağlamda kayıt yok", (await page.$$(".entry-row")).length === 0);

    console.log("\n18 · SAHİPLİK — başkasının kaydı görünmemeli");
    const otherEmail = `other-${stamp}@rung.test`;
    const otherCtx = await browser.createBrowserContext();
    const otherPage = await otherCtx.newPage();
    await signupThrough(otherPage, otherEmail, PASSWORD);
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
    /*
     * KENDİ HESABI. Ana hesap günlük üç ölçüm hakkını 14c'de doldurdu ve bu
     * adımın kaydı reddediliyordu — testin kurgusu, ürünün kusuru değil.
     * Sınır hesap başına, o yüzden taze bir hesap taze bir hakla geliyor.
     */
    const hataCtx = await browser.createBrowserContext();
    const hataPage = await hataCtx.newPage();
    const hataMail = `hata-${stamp}@rung.test`;
    extraAccounts.push(hataMail);
    await signupThrough(hataPage, hataMail, PASSWORD);

    await hataPage.goto(`${BASE}/write`, { waitUntil: "networkidle0" });
    await hataPage.waitForSelector(".composer button[type=submit]", { timeout: 20000 });
    const BAD =
      "i am agree with your suggestion about the meeting of tomorrow. " +
      "Thanks for the informations you sent me , i recieved them yesterday. " +
      "We should discuss about the the details when you are free next week.";
    await hataPage.type(".editor", BAD);
    await hataPage.click(".composer button[type=submit]");
    await waitForUrl(hataPage, (u) => /\/entries\/\d+$/.test(u), 25000);
    await new Promise((r) => setTimeout(r, 600));

    const kinds = await hataPage.$$eval(".fix-kind", (els) =>
      els.map((el) => el.textContent ?? "")
    );
    const joined = kinds.join(" | ");
    check("bulgu üretildi", kinds.length >= 6, `${kinds.length} bulgu`);
    check("Türkçe kaynaklı kalıp yakalandı", /Türkçe kaynaklı/.test(joined), joined);
    check("sayılabilirlik yakalandı", /Sayılabilirlik|sayılabilirlik/i.test(joined), joined);
    check("yazım hatası yakalandı", /Yazım|yazım/.test(joined), joined);
    check("tekrar yakalandı", /tekrar/i.test(joined), joined);

    const marks = await hataPage.$$eval(".read-mark", (els) => els.length);
    check("metinde işaretler var", marks >= 6, `${marks} işaret`);

    const suggestions = await hataPage.$$eval(".fix-now", (els) =>
      els.map((el) => el.textContent)
    );
    check("düzeltme önerisi veriliyor", suggestions.includes("I agree"), suggestions.join(", "));
    await hataCtx.close();

    // ══════════ AŞAMA 09 · KURTARMA ══════════
    /*
     * Şifre sıfırlama ve e-posta doğrulama.
     *
     * JETON VERİTABANINDAN OKUNUYOR, posta kutusundan değil: bu testin konusu
     * AKIŞ, posta taşıması değil. Taşıma ayrı bir şey ve ayrı ölçülüyor
     * (gönderen doğrulaması, DKIM, spam klasörü). Buradan okumak testi
     * sağlayıcıdan ve ağdan bağımsız kılıyor.
     *
     * Jetonun kendisi veritabanında YOK — yalnız SHA-256 özeti var, ki bu
     * tasarımın can alıcı noktası. O yüzden test jetonu üretmiyor; üretilen
     * jetonun ÖZETİNİ okuyup aynı bağlantıyı kuramıyor. Onun yerine akışı
     * uygulamanın kendi ürettiği bağlantıyla değil, DOĞRUDAN eylemi çağırarak
     * değil, ürettiği satırın varlığıyla sınıyoruz — ve bağlantıyı test için
     * ayrı bir yoldan alıyoruz: sunucu geliştirme kipinde bağlantıyı günlüğe
     * yazıyor, ama duman testi canlıya da koşabildiği için oraya bakmıyoruz.
     *
     * Sonuç: burada jetonun ÜRETİLDİĞİ, TEK KULLANIMLIK olduğu ve akışın
     * kapılarının doğru davrandığı ölçülüyor.
     */
    console.log("\n24 · şifre sıfırlama");

    const kurtarCtx = await browser.createBrowserContext();
    const kurtarPage = await kurtarCtx.newPage();
    const kurtarMail = `kurtar-${stamp}@rung.test`;
    await signupThrough(kurtarPage, kurtarMail, PASSWORD);
    extraAccounts.push(kurtarMail);

    /*
     * ŞERİT ARTIK ÇIKMIYOR — ve bu bir gerileme değil, değişikliğin kendisi.
     * Hesap ancak bağlantıya tıklanınca açıldığı için her yeni hesap
     * doğrulanmış doğuyor. Şerit yalnızca bu modelden ÖNCE açılmış hesaplar
     * için duruyor.
     */
    check(
      "yeni hesapta doğrulama şeridi yok",
      (await kurtarPage.$$(".verify")).length === 0
    );

    /*
     * ÖNCE ÇIKIŞ. Kurtarma akışının tamamı oturumu OLMAYAN kişi için: `/login`
     * ve `/forgot` giriş yapmış birini `/write`e yolluyor ve kontroller boşa
     * düşüyor.
     */
    await Promise.all([
      kurtarPage.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}),
      kurtarPage.click(".shell-out"),
    ]);
    await new Promise((r) => setTimeout(r, 500));

    await kurtarPage.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
    check(
      "giriş ekranında şifremi unuttum var",
      (await kurtarPage.$$(".gate-forgot a")).length === 1
    );

    // Kayıtlı ve kayıtsız adres AYNI ekranı vermeli: fark bir kullanıcı
    // listesi çıkarmaya yeterdi.
    async function istekYap(page, mail) {
      await page.goto(`${BASE}/forgot`, { waitUntil: "networkidle0" });
      await page.type('input[name="email"]', mail);
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {}),
        page.click('button[type="submit"]'),
      ]);
      await new Promise((r) => setTimeout(r, 900));
      return readText(page, ".recover-done", 6);
    }

    const yokCevap = await istekYap(kurtarPage, `yok-${stamp}@rung.test`);
    const varCevap = await istekYap(kurtarPage, kurtarMail);
    check("kayıtsız adreste de gönderdik deniyor", Boolean(yokCevap), String(yokCevap).slice(0, 40));
    check(
      "kayıtlı ve kayıtsız adres aynı cevabı veriyor",
      yokCevap === varCevap,
      `${String(yokCevap).slice(0, 30)} / ${String(varCevap).slice(0, 30)}`
    );

    // Jetonun üretildiği ve AÇIK SAKLANMADIĞI veritabanından doğrulanıyor.
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const c = new Client(dbUrl);
      c.on("error", () => {});
      await c.connect();
      try {
        const rows = await c.query(
          `SELECT t.token_hash, t.purpose, t.consumed_at, t.expires_at
             FROM auth_tokens t JOIN users u ON u.id = t.user_id
            WHERE u.email = $1 ORDER BY t.created_at DESC`,
          [kurtarMail]
        );
        const reset = rows.rows.filter((r) => r.purpose === "password_reset");
        const verify = rows.rows.filter((r) => r.purpose === "email_verify");
        /*
         * KAYITTA ARTIK DOĞRULAMA JETONU ÜRETİLMİYOR — ve üretilmemeli.
         *
         * Hesap zaten bir bağlantıya tıklanarak açıldı; adres o anda
         * doğrulanmış sayılıyor. İkinci bir "adresini doğrula" maili, işi
         * bitmiş birine aynı işi tekrar yaptırmak olurdu.
         */
        check("kayıtta ikinci bir doğrulama jetonu üretilmiyor", verify.length === 0, `${verify.length} jeton`);
        check("sıfırlama jetonu üretildi", reset.length >= 1, `${reset.length} jeton`);
        check(
          "jeton açık saklanmıyor — 64 haneli özet",
          reset.every((r) => /^[0-9a-f]{64}$/.test(r.token_hash))
        );
        check(
          "sıfırlama jetonu bir saatten uzun yaşamıyor",
          reset.every(
            (r) => new Date(r.expires_at) - Date.now() <= 61 * 60 * 1000
          )
        );
        /*
         * Üç kez istendiğinde YALNIZ SONUNCUSU bekliyor: kutuda üç çalışan
         * bağlantı birikmesin.
         */
        await istekYap(kurtarPage, kurtarMail);
        const sonra = await c.query(
          `SELECT count(*)::int AS n
             FROM auth_tokens t JOIN users u ON u.id = t.user_id
            WHERE u.email = $1 AND t.purpose = 'password_reset'
              AND t.consumed_at IS NULL`,
          [kurtarMail]
        );
        check(
          "yalnız son sıfırlama bağlantısı geçerli",
          sonra.rows[0].n === 1,
          `${sonra.rows[0].n} bekleyen jeton`
        );
      } finally {
        await c.end();
      }
    }

    // Bağlantısız gelen kişi forma değil, yeniden başlayacağı yere düşüyor.
    await kurtarPage.goto(`${BASE}/reset`, { waitUntil: "networkidle0" });
    check(
      "bağlantısız /reset form göstermiyor",
      (await kurtarPage.$$('input[name="password"]')).length === 0
    );
    await kurtarCtx.close();

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
    await signupThrough(yeniPage, yeniMail, PASSWORD);
    extraAccounts.push(yeniMail);
    const yanan = await yeniPage.$$eval(".rule-step.is-on", (els) => els.length);
    check("kayıtsız hesapta hiçbir bant yanmıyor", yanan === 0, `${yanan} yanan bant`);
    const cetvelNot = await readText(yeniPage, ".rule-none", 4);
    check("neden ölçülmediği yazıyor", Boolean(cetvelNot), String(cetvelNot));

    /*
     * DAR EKRANDA TAŞMA — ölçümü olmayan hesapta.
     *
     * Ekran görüntüsü turu bu durumu hiç görmüyor: tohum hesabının ölçümü var
     * ve "ilk kaydından sonra ölçülüyor" cümlesi çizilmiyor bile. Cümle
     * girdiğinde kabuk çubuğu 390px'te içeriğini kırpıyordu — ve kayıt akışı
     * değiştiğinden beri HER yeni kullanıcı bu ekrana ölçümsüz giriyor.
     */
    await yeniPage.setViewport({ width: 390, height: 844 });
    await yeniPage.reload({ waitUntil: "networkidle0" });
    const dar = await yeniPage.evaluate(() => {
      const doc = document.documentElement;
      const bar = document.querySelector(".shell-bar");
      return {
        page: doc.scrollWidth - doc.clientWidth,
        bar: bar ? bar.scrollWidth - bar.clientWidth : 0,
      };
    });
    check("390px'te sayfa taşmıyor", dar.page <= 1, `${dar.page}px`);
    check("390px'te kabuk çubuğu kırpmıyor", dar.bar <= 1, `${dar.bar}px`);
    await yeniPage.setViewport({ width: 1280, height: 900 });

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

    console.log("\n25 · hesap ekranı ve şifre değiştirme");
    /*
     * Şifre değiştirme oturumu OLAN kişinin yolu ve güvenlik açısından
     * hassas: açık bırakılmış bir ekranın başına oturan biri hesabı
     * devralamamalı. O yüzden mevcut şifre soruluyor ve burada ölçülüyor.
     */
    const hesapCtx = await browser.createBrowserContext();
    const hesapPage = await hesapCtx.newPage();
    const hesapMail = `hesap-${stamp}@rung.test`;
    const YENI_SIFRE = "yeni-duman-sifresi-7431";
    await signupThrough(hesapPage, hesapMail, PASSWORD);
    extraAccounts.push(hesapMail);

    await hesapPage.goto(`${BASE}/account`, { waitUntil: "networkidle0" });
    check(
      "hesap ekranı adresi gösteriyor",
      (await hesapPage.content()).includes(hesapMail)
    );
    check(
      "yeni hesap doğrulanmış görünüyor",
      (await hesapPage.$$(".account-ok")).length === 1
    );

    /* Yanlış mevcut şifreyle değiştirme REDDEDİLMELİ. */
    await hesapPage.type("#current", "kesinlikle-yanlis-sifre");
    await hesapPage.type("#next", YENI_SIFRE);
    await Promise.all([
      hesapPage
        .waitForNavigation({ waitUntil: "networkidle0", timeout: 8000 })
        .catch(() => {}),
      hesapPage.click(".account-card .btn-primary"),
    ]);
    await new Promise((r) => setTimeout(r, 800));
    const yanlisHata = await readText(hesapPage, ".form-error", 8);
    check(
      "yanlış mevcut şifre reddedildi",
      Boolean(yanlisHata) && /Mevcut şifre/i.test(String(yanlisHata)),
      String(yanlisHata).slice(0, 40)
    );

    /* Doğru mevcut şifreyle değiştirme GEÇMELİ. */
    await hesapPage.goto(`${BASE}/account`, { waitUntil: "networkidle0" });
    await hesapPage.type("#current", PASSWORD);
    await hesapPage.type("#next", YENI_SIFRE);
    await Promise.all([
      hesapPage
        .waitForNavigation({ waitUntil: "networkidle0", timeout: 8000 })
        .catch(() => {}),
      hesapPage.click(".account-card .btn-primary"),
    ]);
    await new Promise((r) => setTimeout(r, 1200));
    check(
      "şifre değişti ve onay gösteriliyor",
      (await hesapPage.$$(".recover-done")).length === 1
    );

    /*
     * ASIL KONTROL: eski şifre artık çalışmamalı, yenisi çalışmalı.
     * Onay ekranı göstermek kolay; şifrenin gerçekten değiştiğini ancak
     * giriş denemesi söyler.
     */
    const kanitCtx = await browser.createBrowserContext();
    const kanitPage = await kanitCtx.newPage();
    await kanitPage.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
    await submitAuthForm(kanitPage, hesapMail, PASSWORD);
    check(
      "eski şifre artık çalışmıyor",
      kanitPage.url().includes("/login"),
      kanitPage.url()
    );
    await kanitPage.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
    await submitAuthForm(kanitPage, hesapMail, YENI_SIFRE);
    check(
      "yeni şifreyle giriş yapılıyor",
      kanitPage.url().includes("/write"),
      kanitPage.url()
    );
    await kanitCtx.close();
    await hesapCtx.close();

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
