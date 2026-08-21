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

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
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
    const r = await client.query("DELETE FROM users WHERE email = $1", [EMAIL]);
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
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
    check(
      "/dashboard → /login yönlendirmesi",
      page.url().includes("/login"),
      page.url()
    );

    console.log("\n2 · kayıt");
    await page.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
    await submitAuthForm(page, EMAIL, PASSWORD);
    check("kayıt sonrası /dashboard", page.url().includes("/dashboard"), page.url());
    check(
      "panoda e-posta görünüyor",
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
      "giriş yapmışken /register → /dashboard",
      page.url().includes("/dashboard"),
      page.url()
    );

    console.log("\n4 · çıkış");
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
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
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
    check("tekrar /login'e düşüyor", page.url().includes("/login"), page.url());

    console.log("\n6 · yanlış şifreyle giriş");
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
    await submitAuthForm(page, EMAIL, "kesinlikle-yanlis");
    check("hâlâ /login", page.url().includes("/login"), page.url());
    const errorText = await page.$eval('[role="alert"]', (el) => el.textContent).catch(() => null);
    check("hata mesajı gösteriliyor", Boolean(errorText), String(errorText));
    check(
      "mesaj hangi alanın yanlış olduğunu söylemiyor",
      errorText === "E-posta veya şifre hatalı.",
      String(errorText)
    );

    console.log("\n7 · doğru şifreyle giriş");
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
    await submitAuthForm(page, EMAIL, PASSWORD);
    check("giriş sonrası /dashboard", page.url().includes("/dashboard"), page.url());

    console.log("\n8 · zayıf şifreyle kayıt reddi");
    const page2 = await browser.createBrowserContext().then((c) => c.newPage());
    await page2.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
    await submitAuthForm(page2, `weak-${stamp}@rung.test`, "kisa");
    const weakError = await page2
      .$eval('[role="alert"]', (el) => el.textContent)
      .catch(() => null);
    check("kısa şifre reddedildi", Boolean(weakError), String(weakError));
    check("hâlâ /register", page2.url().includes("/register"), page2.url());

    console.log("\n9 · bozuk e-posta reddi");
    await page2.goto(`${BASE}/register`, { waitUntil: "networkidle0" });
    await submitAuthForm(page2, "bu-bir-eposta-degil", PASSWORD);
    const mailError = await page2
      .$eval('[role="alert"]', (el) => el.textContent)
      .catch(() => null);
    check("bozuk e-posta reddedildi", Boolean(mailError), String(mailError));
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
