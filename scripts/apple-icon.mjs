/*
 * iOS ana ekran ikonunu `app/icon.svg`den türetir.
 *
 * Çalıştırma:  npm run icon
 *
 * Neden ayrı bir dosya: iOS `apple-touch-icon` için SVG'yi güvenilir biçimde
 * çizmiyor, PNG istiyor. Ve KÖŞE YUVARLAMASI OLMAMALI — iOS kendi maskesini
 * uyguluyor; kaynakta da yuvarlatılmış olursa köşede çift kavis çıkıyor.
 * O yüzden karo `rx` sıfırlanarak, tam taşmalı çiziliyor.
 *
 * Kaynak tek: `app/icon.svg`. Sekme ikonu değişince bunu koşturmak yetiyor,
 * ikisi ayrışmıyor.
 */

import { readFileSync, writeFileSync, statSync } from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const KAYNAK = "app/icon.svg";
const CIKTI = "app/apple-icon.png";
const BOYUT = 180;

const svg = readFileSync(KAYNAK, "utf8").replace(/ rx="[\d.]+"/, "");
if (svg.includes('rx="')) throw new Error("karo yuvarlaması silinemedi");

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: BOYUT, height: BOYUT, deviceScaleFactor: 1 });
await page.setContent(
  `<style>html,body{margin:0;padding:0;width:${BOYUT}px;height:${BOYUT}px;overflow:hidden}
   svg{display:block;width:${BOYUT}px;height:${BOYUT}px}</style>${svg}`,
  { waitUntil: "load" }
);
writeFileSync(CIKTI, await page.screenshot({ type: "png" }));
await browser.close();

const d = readFileSync(CIKTI);
const w = d.readUInt32BE(16);
const h = d.readUInt32BE(20);
console.log(`${CIKTI} · ${w}×${h} · ${Math.round(statSync(CIKTI).size / 1024)} KB`);
if (w !== BOYUT || h !== BOYUT) throw new Error(`beklenen ${BOYUT}×${BOYUT}, çıkan ${w}×${h}`);
console.log("sorun: YOK");
