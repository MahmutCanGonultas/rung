/*
 * Maliyet karşılaştırması.
 *
 * Çalıştırma:  node scripts/bench/cost-model.mjs
 *
 * Sayılar ölçülmüş girdi boyutundan geliyor (istem + görev + metin ≈ 700
 * token). Çıktı tahmini: bulgu JSON'u ~250 token + düşünme, çaba seviyesine
 * göre. Düşünme çıktı olarak faturalanıyor ve çıktı girdinin beş katı fiyatta
 * — yani maliyeti asıl belirleyen şey düşünme uzunluğu, metnin boyu değil.
 *
 * Bu betik bir TAHMİN. Gerçek sayılar anahtar gelince `analyses.cost_usd`
 * sütununda birikecek ve doğruluk panosunda gösterilecek.
 */

const PRICING = {
  "claude-opus-5": { input: 5.0, output: 25.0 },
  "claude-sonnet-5": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
};

const K1_INPUT = 700;
const K2_INPUT = 900; // metin + K1 bulguları

const OUTPUT_BY_EFFORT = {
  low: { k1: 550, k2: 450 },
  medium: { k1: 1050, k2: 800 },
  high: { k1: 2250, k2: 1600 },
};

const cost = (model, input, output) =>
  (input / 1e6) * PRICING[model].input + (output / 1e6) * PRICING[model].output;

const money = (x) => `$${x.toFixed(4)}`;
const monthly = (x, n) => `$${(x * n).toFixed(2)}`;

const COMBOS = [
  ["claude-opus-5", "claude-opus-5"],
  ["claude-sonnet-5", "claude-sonnet-5"],
  ["claude-sonnet-5", "claude-haiku-4-5"],
  ["claude-haiku-4-5", "claude-haiku-4-5"],
];

const short = (m) => m.replace("claude-", "").replace("-4-5", " 4.5").replace("-5", " 5");

for (const effort of ["low", "medium", "high"]) {
  const out = OUTPUT_BY_EFFORT[effort];
  console.log(`\nÇABA: ${effort}  (K1 çıktı ${out.k1} tk · K2 çıktı ${out.k2} tk)`);
  console.log("K1 modeli".padEnd(14) + "K2 modeli".padEnd(14) +
    "kayıt başı".padStart(12) + "100 kayıt/ay".padStart(14) + "500 kayıt/ay".padStart(14));
  console.log("─".repeat(68));

  for (const [k1, k2] of COMBOS) {
    const total = cost(k1, K1_INPUT, out.k1) + cost(k2, K2_INPUT, out.k2);
    console.log(
      short(k1).padEnd(14) + short(k2).padEnd(14) +
      money(total).padStart(12) + monthly(total, 100).padStart(14) + monthly(total, 500).padStart(14)
    );
  }
}

console.log("\nSadece K1 (ikinci geçiş henüz yok — bugünkü durum):");
for (const effort of ["low", "medium", "high"]) {
  const line = Object.keys(PRICING)
    .map((m) => `${short(m)} ${money(cost(m, K1_INPUT, OUTPUT_BY_EFFORT[effort].k1))}`)
    .join("  ·  ");
  console.log(`  çaba ${effort.padEnd(7)} ${line}`);
}
