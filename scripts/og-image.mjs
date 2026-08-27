/*
 * Paylaşım kartını kaynak fotoğraftan türetir.
 *
 * Çalıştırma:  npm run og
 *
 * Kaynak `docs/shots/rung-foto.png`, çıktı `app/opengraph-image.jpg`. Next.js
 * o dosya adını kendisi tanıyor ve `og:image` etiketini üretiyor — elle yazılan
 * bir yol yok, yani dosya değişince meta da değişiyor.
 *
 * Neden ayrı bir adım: kaynak 1635×962 ve 1,7 MB. Paylaşım kartının 1200×630
 * olması gerekiyor (WhatsApp, LinkedIn, X hepsi bu oranı bekliyor) ve fotoğraf
 * PNG olarak durduğunda 900 KB, JPEG olarak 128 KB. Fotoğrafta PNG'nin
 * kayıpsızlığının hiçbir faydası yok.
 *
 * Kaynak değişince tek yapılacak: dosyayı aynı yola koyup bunu koşturmak.
 *
 * `sips` macOS'ta yerleşik — yeni bağımlılık yok.
 *
 * TON DÜZELTMESİ: kadrajdaki ölçülen basamak kaynakta zümrüt yeşili ve stil
 * sayfası onu `hue-rotate(78deg) saturate(0.55)` ile izin mavisine taşıyor.
 * Paylaşım kartı düzeltmesiz üretilirse WhatsApp'ta çıkan görsel sitede olmayan
 * bir renkte oluyor. Aynı süzgeç burada da uygulanıyor — DEĞERLER TEK YERDEN
 * DEĞİL diye tekrarlanıyor ve o yüzden ikisi birlikte değişmek zorunda; bu
 * yorum o bağı taşıyan şey.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const KAYNAK = "docs/shots/rung-foto.png";
const CIKTI = "app/opengraph-image.jpg";
const EN = 1200;
const BOY = 630;
/** Fotoğrafta 85 ile 90 arasında gözle fark yok; 85 dosyayı ~%6 küçültüyor. */
const KALITE = 85;

const olcu = (yol) => {
  const d = readFileSync(yol);
  if (d.readUInt32BE(0) !== 0x89504e47) throw new Error(`${yol} PNG değil`);
  return { w: d.readUInt32BE(16), h: d.readUInt32BE(20) };
};

const { w, h } = olcu(KAYNAK);
const hedefOran = EN / BOY;

/*
 * Önce ORANA kırp, sonra ölçekle. Doğrudan `sips -z` her iki boyutu da
 * zorluyor: 1,700 oranındaki bir kaynağı 1,905'e sıkıştırıp fotoğrafı eziyor.
 * Bu sırayla nesne kendi oranını koruyor.
 */
const kirpBoy = Math.round(w / hedefOran);
const kirpEn = kirpBoy <= h ? w : Math.round(h * hedefOran);
const sonBoy = kirpBoy <= h ? kirpBoy : h;

const gecici = mkdtempSync(join(tmpdir(), "rung-og-"));
const ara = join(gecici, "kirpik.png");
const boyali = join(gecici, "boyali.png");

/*
 * Süzgeci tarayıcı uyguluyor: aynı CSS motoru, aynı sonuç. Elle yazılmış bir
 * piksel dönüşümü sitedekiyle birebir aynı çıkmazdı.
 */
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SUZGEC = "hue-rotate(78deg) saturate(0.55)";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
const veri = readFileSync(KAYNAK).toString("base64");
await page.setContent(
  `<style>html,body{margin:0;background:#000}
   img{display:block;width:${w}px;height:${h}px;filter:${SUZGEC}}</style>
   <img src="data:image/png;base64,${veri}">`,
  { waitUntil: "load" }
);
await page.screenshot({ path: boyali, type: "png" });
await browser.close();

execFileSync("sips", ["-c", String(sonBoy), String(kirpEn), boyali, "--out", ara], {
  stdio: "ignore",
});
execFileSync(
  "sips",
  ["-z", String(BOY), String(EN), "-s", "format", "jpeg",
   "-s", "formatOptions", String(KALITE), ara, "--out", CIKTI],
  { stdio: "ignore" }
);

const son = olcu2(CIKTI);
function olcu2(yol) {
  // JPEG: SOF0/SOF2 işaretçisinden boyut
  const d = readFileSync(yol);
  for (let i = 2; i < d.length - 9; ) {
    if (d[i] !== 0xff) { i++; continue; }
    const m = d[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
      return { w: d.readUInt16BE(i + 7), h: d.readUInt16BE(i + 5) };
    i += 2 + d.readUInt16BE(i + 2);
  }
  throw new Error("JPEG boyutu okunamadı");
}

const kb = Math.round(statSync(CIKTI).size / 1024);
console.log(`kaynak  ${w}×${h}`);
console.log(`kırpıldı ${kirpEn}×${sonBoy} · oran ${(kirpEn / sonBoy).toFixed(4)}`);
console.log(`çıktı   ${son.w}×${son.h} · ${kb} KB · ${CIKTI}`);

if (son.w !== EN || son.h !== BOY) throw new Error(`beklenen ${EN}×${BOY}, çıkan ${son.w}×${son.h}`);
if (kb > 400) throw new Error(`kart ${kb} KB — paylaşım için fazla ağır`);
console.log("\nsorun: YOK");
