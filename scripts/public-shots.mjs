/*
 * Herkese açık ekranlar — hızlı tur.
 *
 * Çalıştırma:  npm run shots:public -- <klasör>
 *
 * `scripts/shots.mjs` dokuz ekranı gerçek veriyle çekiyor ve dakikalar sürüyor.
 * Giriş ekranı üzerinde çalışırken her denemede o turu koşturmak işi
 * durduruyordu. Bu araç veritabanına hiç dokunmuyor: iki sayfa da giriş
 * yapmamış ziyaretçinin gördüğü hâliyle çekiliyor.
 *
 * Görüntüler `prefers-reduced-motion` açıkken alınıyor — o tercih bitmiş kareyi
 * garanti ediyor ve asıl doğrulanması gereken durum zaten o: temel CSS daima
 * bitmiş kare olmalı.
 */

import puppeteer from "puppeteer-core";

const OUT = process.argv[2];
if (!OUT) throw new Error("çıktı klasörü gerekiyor");

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3000";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const PAGES = [
  ["anasayfa", "/"],
  ["giris", "/login"],
  ["kayit", "/register"],
];

const SIZES = [
  [1440, 940, "gs"],
  [1024, 800, "orta"],
  [390, 844, "mb"],
];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
  });

  const page = await browser.newPage();
  const problems = [];

  for (const dark of [false, true]) {
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: dark ? "dark" : "light" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);

    for (const [name, path] of PAGES) {
      for (const [w, h, tag] of SIZES) {
        await page.setViewport({ width: w, height: h });
        await page.goto(BASE + path, { waitUntil: "networkidle0" });
        await new Promise((r) => setTimeout(r, 350));

        const check = await page.evaluate(() => {
          const docW = document.documentElement.clientWidth;
          const over = [...document.querySelectorAll("body *")]
            .filter((el) => el.getBoundingClientRect().right > docW + 1)
            .map((el) => `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}`);

          // Formun ilk alanı ekranın neresinde? Katlanmanın altına düşmemeli.
          // Anasayfada form yok; kontrol kendiliğinden atlanıyor.
          const email = document.querySelector('input[name="email"]');
          const box = email ? email.getBoundingClientRect() : null;

          return {
            overflow: document.documentElement.scrollWidth > docW + 1,
            culprits: [...new Set(over)].slice(0, 3),
            emailTop: box ? Math.round(box.top) : null,
            emailGorunur: box ? box.top >= 0 && box.bottom <= window.innerHeight : null,
            ilkOdak: document.activeElement?.getAttribute("name") ?? document.activeElement?.tagName,
          };
        });

        const tag2 = `${name}-${tag}-${dark ? "koyu" : "acik"}`;
        if (check.overflow) {
          problems.push(`${tag2}: yatay taşma — ${check.culprits.join(", ")}`);
        }
        if (check.emailGorunur === false) {
          problems.push(`${tag2}: e-posta alanı katlanmanın altında (y=${check.emailTop})`);
        }

        // Anasayfa uzun: tam sayfa. Giriş/kayıt tek ekrana sığmalı.
        await page.screenshot({
          path: `${OUT}/${tag2}.png`,
          fullPage: name === "anasayfa" && tag === "gs",
        });
      }
    }
  }

  await browser.close();

  console.log(`${PAGES.length} ekran × ${SIZES.length} genişlik × 2 tema = ${PAGES.length * SIZES.length * 2} görüntü`);
  console.log(problems.length ? "\nSORUN:\n  " + problems.join("\n  ") : "\nsorun: YOK");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
