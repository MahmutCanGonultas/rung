/*
 * `app/icon.svg`den `app/favicon.ico` ve `app/apple-icon.png` üretir.
 *
 * Çalıştırma:  npm run icon
 *
 * NEDEN .ICO DA GEREKİYOR: `app/icon.svg` tek başına doğru etiketi üretiyor ve
 * çoğu tarayıcı onu çiziyor — ama sekme ikonu tarayıcının en agresif
 * önbelleklediği kaynak, ve bazı sürümler SVG'yi hiç denemeden köke `/favicon.ico`
 * istiyor. O dosya yoksa sekmede boş sayfa simgesi kalıyor. `.ico` varsa Next
 * onu da bağlıyor ve ikisi birlikte her tarayıcıyı kapsıyor.
 *
 * ICO içinde PNG taşınıyor (Vista'dan beri geçerli): 16, 32 ve 48 piksel.
 * Üçü de aynı SVG'den, yani tek kaynak.
 *
 * APPLE ikonunda karo yuvarlaması SİLİNİYOR — iOS kendi maskesini uyguluyor,
 * kaynakta da yuvarlak olursa köşede çift kavis çıkıyor. Sekme ikonunda ise
 * yuvarlama KALIYOR, orada maske yok.
 */

import { readFileSync, writeFileSync, statSync } from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const KAYNAK = "app/icon.svg";
const ICO = "app/favicon.ico";
const APPLE = "app/apple-icon.png";
const ICO_BOYUTLAR = [16, 32, 48];
const APPLE_BOYUT = 180;

const svg = readFileSync(KAYNAK, "utf8");
const svgDuz = svg.replace(/ rx="[\d.]+"/, "");
if (svgDuz.includes('rx="')) throw new Error("karo yuvarlaması silinemedi");

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--hide-scrollbars"],
});

async function ciz(kaynak, boyut) {
  const page = await browser.newPage();
  await page.setViewport({ width: boyut, height: boyut, deviceScaleFactor: 1 });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;width:${boyut}px;height:${boyut}px;overflow:hidden}
     svg{display:block;width:${boyut}px;height:${boyut}px}</style>${kaynak}`,
    { waitUntil: "load" }
  );
  const png = await page.screenshot({ type: "png", omitBackground: true });
  await page.close();
  return png;
}

/** Basit ICO paketleyici: dizin girdileri + gömülü PNG'ler. */
function icoPaketle(pngler) {
  const n = pngler.length;
  const bas = Buffer.alloc(6);
  bas.writeUInt16LE(0, 0);      // ayrılmış
  bas.writeUInt16LE(1, 2);      // tip: ikon
  bas.writeUInt16LE(n, 4);
  const dizin = [];
  let ofset = 6 + n * 16;
  for (const { boyut, veri } of pngler) {
    const g = Buffer.alloc(16);
    g.writeUInt8(boyut >= 256 ? 0 : boyut, 0);
    g.writeUInt8(boyut >= 256 ? 0 : boyut, 1);
    g.writeUInt8(0, 2);         // palet yok
    g.writeUInt8(0, 3);
    g.writeUInt16LE(1, 4);      // düzlem
    g.writeUInt16LE(32, 6);     // bit derinliği
    g.writeUInt32LE(veri.length, 8);
    g.writeUInt32LE(ofset, 12);
    ofset += veri.length;
    dizin.push(g);
  }
  return Buffer.concat([bas, ...dizin, ...pngler.map((x) => x.veri)]);
}

const pngler = [];
for (const boyut of ICO_BOYUTLAR) {
  pngler.push({ boyut, veri: await ciz(svg, boyut) });
}
writeFileSync(ICO, icoPaketle(pngler));
writeFileSync(APPLE, await ciz(svgDuz, APPLE_BOYUT));
await browser.close();

const ico = readFileSync(ICO);
const sayi = ico.readUInt16LE(4);
if (ico.readUInt16LE(2) !== 1) throw new Error("ICO tipi yanlış");
if (sayi !== ICO_BOYUTLAR.length) throw new Error(`ICO'da ${sayi} boy var, ${ICO_BOYUTLAR.length} bekleniyordu`);
const elma = readFileSync(APPLE);
if (elma.readUInt32BE(16) !== APPLE_BOYUT) throw new Error("apple-icon boyutu yanlış");

console.log(`${ICO}   · ${ICO_BOYUTLAR.join(", ")} px · ${Math.round(statSync(ICO).size / 1024)} KB`);
console.log(`${APPLE} · ${APPLE_BOYUT}×${APPLE_BOYUT} · ${Math.round(statSync(APPLE).size / 1024)} KB`);
console.log("sorun: YOK");
