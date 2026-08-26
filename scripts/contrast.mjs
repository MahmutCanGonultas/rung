/*
 * Kontrast ölçer — EKRANDAKİ PİKSELDEN.
 *
 * Çalıştırma:  node scripts/contrast.mjs [yol …]
 *
 * Neden piksel: ilk denemede bu ölçüm `getComputedStyle` ile yapılmıştı, ata
 * zincirinde saydam olmayan ilk zemin aranıyordu. O araç 106 hata bildirdi ve
 * neredeyse hepsi UYDURMAYDI — gradyan zeminleri, alfa harmanını ve devralınan
 * `opacity`yi göremediği için, hiçbir atasında düz renk bulamadığında zemini
 * SİYAH sayıyordu. Başlık "1,16:1" çıkıyordu; ekranda krem üstünde koyu serif
 * duruyor. Ölçen araç yanlış ölçüyordu.
 *
 * Bu sürüm MELEZ, ve iki yarısı da sebepli:
 *
 *   · ZEMİN ekran görüntüsünden okunuyor. PNG kendi çözülüyor (zlib yerleşik,
 *     yeni bağımlılık yok); metnin satır kutusundaki en sık renk zemindir.
 *     Gradyan, alfa harmanı, karışım kipi, üst üste binen katmanlar — hepsi
 *     zaten pikselin içinde, hesaplamaya gerek yok.
 *   · METİN RENGİ CSS'ten alınıyor, pikselden DEĞİL. Piksel de denendi ve
 *     reddedildi: 10px'lik ince bir yazıda tırtıklama hiçbir pikseli tam renge
 *     boyamıyor, o yüzden araç sistematik olarak düşük okuyordu. WCAG zaten
 *     BELİRTİLEN rengi ölçüyor. Devralınan `opacity` ve rengin kendi alfası
 *     ölçülen zeminin üstüne harmanlanıyor.
 *
 * Taban WCAG AA: normal metin 4,5:1; büyük metin (≥24px, ya da ≥18,66px kalın)
 * 3:1.
 */

import { inflateSync } from "node:zlib";
import puppeteer from "puppeteer-core";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3000";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const YOLLAR = process.argv.slice(2).length ? process.argv.slice(2) : ["/", "/login", "/register"];

/** PNG → {w, h, px:Uint8Array(RGBA)}. 8 bit, renk tipi 2 (RGB) veya 6 (RGBA). */
function pngCoz(buf) {
  let p = 8, w = 0, h = 0, tip = 0, veri = [];
  while (p < buf.length) {
    const uzunluk = buf.readUInt32BE(p);
    const ad = buf.toString("ascii", p + 4, p + 8);
    const govde = buf.subarray(p + 8, p + 8 + uzunluk);
    if (ad === "IHDR") {
      w = govde.readUInt32BE(0); h = govde.readUInt32BE(4);
      if (govde[8] !== 8) throw new Error(`bit derinliği 8 değil: ${govde[8]}`);
      tip = govde[9];
      if (tip !== 2 && tip !== 6) throw new Error(`renk tipi desteklenmiyor: ${tip}`);
      if (govde[12] !== 0) throw new Error("araya geçmeli PNG desteklenmiyor");
    } else if (ad === "IDAT") veri.push(govde);
    else if (ad === "IEND") break;
    p += 12 + uzunluk;
  }
  const ham = inflateSync(Buffer.concat(veri));
  const kanal = tip === 6 ? 4 : 3;
  const satir = w * kanal;
  const px = new Uint8Array(w * h * 4);
  const onceki = new Uint8Array(satir);
  const simdi = new Uint8Array(satir);
  for (let y = 0; y < h; y++) {
    const suzgec = ham[y * (satir + 1)];
    const kaynak = ham.subarray(y * (satir + 1) + 1, (y + 1) * (satir + 1));
    for (let i = 0; i < satir; i++) {
      const x = kaynak[i];
      const a = i >= kanal ? simdi[i - kanal] : 0;   // sol
      const b = onceki[i];                            // üst
      const c = i >= kanal ? onceki[i - kanal] : 0;   // sol üst
      let v;
      if (suzgec === 0) v = x;
      else if (suzgec === 1) v = x + a;
      else if (suzgec === 2) v = x + b;
      else if (suzgec === 3) v = x + ((a + b) >> 1);
      else if (suzgec === 4) {
        const t = a + b - c, da = Math.abs(t - a), db = Math.abs(t - b), dc = Math.abs(t - c);
        v = x + (da <= db && da <= dc ? a : db <= dc ? b : c);
      } else throw new Error(`bilinmeyen süzgeç: ${suzgec}`);
      simdi[i] = v & 0xff;
    }
    for (let x = 0; x < w; x++) {
      const s = x * kanal, d = (y * w + x) * 4;
      px[d] = simdi[s]; px[d + 1] = simdi[s + 1]; px[d + 2] = simdi[s + 2];
      px[d + 3] = kanal === 4 ? simdi[s + 3] : 255;
    }
    onceki.set(simdi);
  }
  return { w, h, px };
}

const dogrusal = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const parlaklik = ([r, g, b]) => 0.2126 * dogrusal(r) + 0.7152 * dogrusal(g) + 0.0722 * dogrusal(b);
const oran = (a, b) => { const x = parlaklik(a), y = parlaklik(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hex = ([r, g, b]) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

/*
 * Metin satırının GERÇEK zemini: kutudaki en sık piksel rengi — AMA metnin
 * kendi rengine yakın pikseller elenerek.
 *
 * Çıplak "en sık renk" varsayımı büyük puntoda ÇÖKÜYOR. ÖLÇÜLDÜ: 48px'lik
 * serif bir başlıkta harf pikselleri 2493, zemin pikselleri 1387 — yani en sık
 * renk metnin kendisi çıkıyor ve araç kontrastı 1:1 bildiriyordu. Ürün
 * kusursuzdu (gerçek oran 10,45:1), yanlış ölçen araçtı.
 *
 * Metin rengini zaten CSS'ten biliyoruz; ona yakın pikselleri saymamak
 * tahmin değil, elimizdeki bilgiyi kullanmak. Tırtıklama ara tonlarını da
 * kapsasın diye eşik geniş tutuldu.
 */
function zeminOku(resim, kutu, metinRengi) {
  const x0 = Math.max(0, Math.round(kutu.x)), y0 = Math.max(0, Math.round(kutu.y));
  const x1 = Math.min(resim.w, Math.round(kutu.x + kutu.w));
  const y1 = Math.min(resim.h, Math.round(kutu.y + kutu.h));
  if (x1 - x0 < 2 || y1 - y0 < 2) return null;
  const say = new Map();
  const hepsi = new Map();
  const [mr, mg, mb] = metinRengi;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * resim.w + x) * 4;
      const r = resim.px[i], g = resim.px[i + 1], b = resim.px[i + 2];
      const k = (r << 16) | (g << 8) | b;
      hepsi.set(k, (hepsi.get(k) ?? 0) + 1);
      const d = (r - mr) ** 2 + (g - mg) ** 2 + (b - mb) ** 2;
      if (d < 3600) continue;              // metnin kendisi ve tırtıkları
      say.set(k, (say.get(k) ?? 0) + 1);
    }
  }
  // Her şey elendiyse (kutu baştan sona metin rengi) çıplak kipe düş.
  const kaynak = say.size ? say : hepsi;
  let en = -1, enCok = -1;
  for (const [k, n] of kaynak) if (n > enCok) { enCok = n; en = k; }
  return [(en >> 16) & 255, (en >> 8) & 255, en & 255];
}

/** src'yi dst'nin üstüne alfa ile harmanla. */
const harmanla = (src, a, dst) => src.map((v, i) => Math.round(v * a + dst[i] * (1 - a)));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 940, deviceScaleFactor: 1 });

let bakilan = 0, kalan = 0;
for (const tema of ["light", "dark"]) {
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: tema },
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  for (const yol of YOLLAR) {
    await page.goto(BASE + yol, { waitUntil: "networkidle0" });
    /*
     * TEMBEL GÖRSELLER YÜKLENSİN. `networkidle0` yetmiyor: ekran dışındaki
     * `next/image` yüklemeye sayfanın altına inilene kadar başlamıyor ve ölçüm
     * bulanık yer tutucunun üstünde yapılıyordu.
     */
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 300));
      window.scrollTo(0, 0);
      await Promise.all(
        [...document.images].map((g) =>
          g.complete ? null : new Promise((r) => { g.onload = g.onerror = r; })
        )
      );
    });
    await new Promise((r) => setTimeout(r, 350));
    // Kendi imlecimiz ölçüme girmesin.
    await page.evaluate(() => document.activeElement?.blur?.());
    const kutular = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("main *, header *, footer *")) {
        const yazi = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("");
        if (!yazi) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
        /*
         * Elemanın kutusu DEĞİL, metnin kendi satır kutuları. Bir paragrafın
         * kutusu çoğunlukla boşluktur; `Range.getClientRects()` harflerin
         * gerçekten durduğu dar dikdörtgenleri veriyor, orada piksel yoğunluğu
         * yüksek ve ölçüm metnin kendisine düşüyor.
         */
        const px = parseFloat(cs.fontSize), w = +cs.fontWeight;
        // Devralınan opaklık zinciri: ata üstünde `opacity` metni de soluklaştırır.
        let opak = 1;
        for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
          opak *= +getComputedStyle(n).opacity;
        }
        const c = (cs.color.match(/[\d.]+/g) || ["0", "0", "0"]).map(Number);
        const ortak = {
          renk: [c[0], c[1], c[2]],
          alfa: (c.length > 3 ? c[3] : 1) * opak,
          yazi: yazi.replace(/\s+/g, " ").slice(0, 34),
          sinif: (el.className || "").toString().split(" ")[0] || el.tagName.toLowerCase(),
          px: +px.toFixed(1), w,
          taban: px >= 24 || (px >= 18.66 && w >= 700) ? 3 : 4.5,
        };
        for (const n of el.childNodes) {
          if (n.nodeType !== 3 || !n.textContent.trim()) continue;
          const aralik = document.createRange();
          aralik.selectNodeContents(n);
          for (const r of aralik.getClientRects()) {
            if (r.width < 4 || r.height < 4) continue;
            out.push({ ...ortak, x: r.x + scrollX, y: r.y + scrollY, w2: r.width, h: r.height });
          }
        }
      }
      return out;
    });
    const resim = pngCoz(await page.screenshot({ fullPage: true, type: "png" }));
    const gorulen = new Set();
    for (const k of kutular) {
      const zemin = zeminOku(resim, { x: k.x, y: k.y, w: k.w2, h: k.h }, k.renk);
      if (!zemin) continue;
      const metin = harmanla(k.renk, k.alfa, zemin);
      const o = +oran(metin, zemin).toFixed(2);
      bakilan++;
      if (o >= k.taban) continue;
      // Aynı sınıf + aynı renk çifti bir kez bildiriliyor; yirmi bir jeton yirmi bir satır etmesin.
      const imza = `${tema}|${k.sinif}|${hex(metin)}|${hex(zemin)}|${k.taban}`;
      if (gorulen.has(imza)) continue;
      gorulen.add(imza);
      kalan++;
      console.log(
        `  KALDI  ${tema.padEnd(5)} ${yol.padEnd(10)} ${String(o).padStart(5)}:1 ` +
        `(taban ${k.taban})  ${hex(metin)} / ${hex(zemin)}  ${k.px}px/${k.w}  .${k.sinif} — "${k.yazi}"`
      );
    }
  }
}
console.log(`\n${bakilan} metin kutusu ölçüldü · ${kalan} ayrı kusur`);
await browser.close();
process.exit(kalan ? 1 : 0);
