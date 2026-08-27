/*
 * Stil kapsamı — hangi sınıf JSX'te kullanılıyor ama CSS'te hiç geçmiyor.
 *
 * Stil sayfası sıfırdan yazılırken tek gerçek risk BİR SINIFI ATLAMAK: o
 * ekran çıplak kalıyor ve hiçbir test bunu yakalamıyor, çünkü sayfa yine
 * 200 dönüyor ve içindeki metin yine orada.
 *
 * Ters yönü de sayıyor: CSS'te tanımlı ama artık hiçbir yerde kullanılmayan
 * sınıflar. Sıfırdan yazılan bir stil sayfasında ölü kural olmamalı.
 *
 * Çalıştırma:  npm run styles
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const KOK = "app";
const CSS = "app/globals.css";

function tsxDosyalari(dizin) {
  const out = [];
  for (const ad of readdirSync(dizin)) {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) out.push(...tsxDosyalari(yol));
    else if (ad.endsWith(".tsx")) out.push(yol);
  }
  return out;
}

/*
 * className={...} içindeki HER dizgi sabitini topluyoruz — koşullu ifadeler
 * ("a is-on" : "a") ve şablon dizgileri dahil. Şablon içinde ${...} varsa o
 * parça atlanıyor: `band-${band}` gibi hesaplanan adlar aşağıdaki
 * HESAPLANAN listesinde elle duruyor, çünkü statik olarak bilinemezler.
 */
const HESAPLANAN = [
  "band-A1", "band-A2", "band-B1", "band-B2", "band-C1",
  "tone-good", "tone-bad", "tone-flat",
  "mark-sm", "mark-md", "mark-lg",
];

function siniflariTopla() {
  const harita = new Map();
  for (const yol of tsxDosyalari(KOK)) {
    const t = readFileSync(yol, "utf8");
    const re = /className\s*[=:]\s*(\{|"|\[)/g;
    let m;
    while ((m = re.exec(t)) !== null) {
      const bas = m.index + m[0].length - 1;
      let son = bas;
      if (t[bas] === '"') {
        son = t.indexOf('"', bas + 1);
      } else {
        /* className={...} ve className={[...]} — dengeli parantez say. */
        const ac = t[bas];
        const kap = ac === "{" ? "}" : "]";
        let d = 0;
        for (son = bas; son < t.length; son++) {
          if (t[son] === ac) d++;
          else if (t[son] === kap && --d === 0) break;
        }
      }
      const parca = t.slice(bas, son + 1);
      const dizgiler = [
        ...parca.matchAll(/"([^"]*)"/g),
        ...parca.matchAll(/`([^`]*)`/g),
      ].map((x) => x[1]);
      for (const d of dizgiler) {
        for (const c of d.split(/\s+/)) {
          if (!c || c.includes("${")) continue;
          if (!harita.has(c)) harita.set(c, new Set());
          harita.get(c).add(yol);
        }
      }
    }
  }
  for (const c of HESAPLANAN) if (!harita.has(c)) harita.set(c, new Set(["(hesaplanan)"]));
  return harita;
}

const kullanilan = siniflariTopla();
const css = readFileSync(CSS, "utf8");

/* Yorumları çıkar: yorumun içinde geçen bir sınıf adı "tanımlı" sayılmamalı. */
const kural = css.replace(/\/\*[\s\S]*?\*\//g, "");
const tanimli = new Set(
  [...kural.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)].map((m) => m[1])
);

const eksik = [...kullanilan.keys()].filter((c) => !tanimli.has(c)).sort();
const olu = [...tanimli].filter((c) => !kullanilan.has(c)).sort();

console.log(`sınıf · kullanılan ${kullanilan.size} · CSS'te tanımlı ${tanimli.size}`);

if (eksik.length > 0) {
  console.log(`\nBİÇİMLENDİRİLMEMİŞ · ${eksik.length}`);
  for (const c of eksik) {
    const nerede = [...kullanilan.get(c)].map((p) => p.replace(/^app\//, "")).join(", ");
    console.log(`  .${c.padEnd(24)} ${nerede}`);
  }
}

if (olu.length > 0) {
  console.log(`\nÖLÜ KURAL · ${olu.length}`);
  console.log("  " + olu.map((c) => "." + c).join("  "));
}

/*
 * ── İKİ KOYU TEMA BLOĞU BİREBİR AYNI MI ──────────────────────────────
 *
 * Koyu tema iki yerde tanımlı: biri sistem tercihini karşılıyor
 * (`@media (prefers-color-scheme: dark)` içindeki `:root:not([data-theme="light"])`),
 * diğeri kullanıcının açık seçimini (`:root[data-theme="dark"]`).
 *
 * Ayrışırlarsa aynı sayfa iki farklı renkte çiziliyor ve kimse fark
 * etmiyor — geçmişte tam olarak bu oldu: bir düzeltme yalnız bir bloğa
 * uygulandı ve iki basamak rengi aylarca farklı kaldı. Eşitlik artık
 * ölçülüyor.
 */
function blok(satirlar, bas) {
  let d = 0;
  const out = [];
  for (let k = bas; k < satirlar.length; k++) {
    d += (satirlar[k].match(/{/g) ?? []).length;
    d -= (satirlar[k].match(/}/g) ?? []).length;
    out.push(satirlar[k]);
    if (d === 0 && k > bas) break;
  }
  return out.join("\n");
}
function jetonlar(s) {
  const m = new Map();
  for (const [, ad, deger] of s.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    m.set(ad, deger.trim().replace(/\s+/g, " "));
  }
  return m;
}

const satirlar = css.split("\n");
const i1 = satirlar.findIndex((l) => l.trim().startsWith(':root:not([data-theme="light"])'));
const i2 = satirlar.findIndex((l) => l.startsWith(':root[data-theme="dark"]'));

let temaFarki = [];
if (i1 < 0 || i2 < 0) {
  temaFarki = ["koyu tema bloklarından biri bulunamadı"];
} else {
  const a = jetonlar(blok(satirlar, i1));
  const b = jetonlar(blok(satirlar, i2));
  for (const ad of new Set([...a.keys(), ...b.keys()])) {
    if (a.get(ad) !== b.get(ad)) {
      temaFarki.push(`${ad}: ${a.get(ad) ?? "(yok)"} ≠ ${b.get(ad) ?? "(yok)"}`);
    }
  }
  console.log(`koyu tema · iki blok, ${a.size} ve ${b.size} jeton`);
}

if (temaFarki.length > 0) {
  console.log(`\nKOYU TEMA BLOKLARI AYRIŞMIŞ · ${temaFarki.length}`);
  for (const f of temaFarki) console.log("  " + f);
}

if (eksik.length === 0 && olu.length === 0 && temaFarki.length === 0) {
  console.log("\nsorun: YOK");
}
process.exit(eksik.length > 0 || temaFarki.length > 0 ? 1 : 0);
