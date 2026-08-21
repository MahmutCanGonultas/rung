/*
 * İki yazım denetleyicisini aynı altın kümede ölçer.
 *
 * Çalıştırma:  node scripts/bench/spell-bench.mjs
 *
 * Ölçütler projenin kendi diliyle:
 *   isabet (precision) = işaretlediklerinin kaçı gerçekten hatalı
 *   yakalama (recall)  = gerçek hataların kaçını işaretlemiş
 *
 * Plan §07: "Asıl problem hangi hatayı kaçırdığın değil. Doğru olan cümleyi
 * düzeltirsen güveni kaybedersin." O yüzden karar yakalamaya değil
 * **yanlış alarma** bakılarak veriliyor.
 */

import { readFile } from "node:fs/promises";

import nspell from "nspell";
import dictionaryEn from "dictionary-en";

import { CORRECT, MISSPELLED } from "./spell-gold.mjs";

async function buildNspell() {
  const speller = nspell(dictionaryEn);
  return {
    name: "nspell + dictionary-en (Hunspell)",
    isMisspelled: (word) => !speller.correct(word),
  };
}

async function buildWordList() {
  const raw = await readFile("/usr/share/dict/words", "utf8");
  const words = new Set(
    raw.split("\n").map((w) => w.trim().toLowerCase()).filter(Boolean)
  );
  return {
    name: `sistem kelime listesi (${words.size.toLocaleString("tr-TR")} kelime)`,
    isMisspelled: (word) => !words.has(word.toLowerCase()),
  };
}

function measure(checker) {
  let truePositive = 0;
  let falseNegative = 0;
  const missed = [];
  for (const word of MISSPELLED) {
    if (checker.isMisspelled(word)) truePositive++;
    else {
      falseNegative++;
      missed.push(word);
    }
  }

  let falsePositive = 0;
  const falseAlarms = [];
  for (const word of CORRECT) {
    if (checker.isMisspelled(word)) {
      falsePositive++;
      falseAlarms.push(word);
    }
  }

  const precision = truePositive / (truePositive + falsePositive || 1);
  const recall = truePositive / (truePositive + falseNegative || 1);

  return {
    precision,
    recall,
    falseAlarmRate: falsePositive / CORRECT.length,
    missed,
    falseAlarms,
  };
}

function pct(x) {
  return `${(x * 100).toFixed(1)}%`;
}

const checkers = [await buildNspell(), await buildWordList()];

console.log(
  `altın küme · ${MISSPELLED.length} hatalı + ${CORRECT.length} doğru kelime\n`
);

for (const checker of checkers) {
  const r = measure(checker);
  console.log(checker.name);
  console.log(`  isabet        ${pct(r.precision)}`);
  console.log(`  yakalama      ${pct(r.recall)}`);
  console.log(`  YANLIŞ ALARM  ${pct(r.falseAlarmRate)}  ← ana ölçüt`);
  if (r.falseAlarms.length > 0) {
    console.log(`  doğruya hata dedi: ${r.falseAlarms.join(", ")}`);
  }
  if (r.missed.length > 0) {
    console.log(`  kaçırdığı hatalar: ${r.missed.join(", ")}`);
  }
  console.log();
}
