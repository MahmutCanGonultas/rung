/*
 * Ölçüm koşumu (eval).
 *
 * Çalıştırma:
 *   npm run eval                      gerçek model
 *   npm run eval -- --fake            sahte model (anahtarsız duman testi)
 *   npm run eval -- --k1-only         ikinci geçiş olmadan
 *   npm run eval -- --limit=10        ilk N örnek
 *   npm run eval -- --note="v2 denemesi"
 *
 * Model ve çaba ortam değişkeninden: RUNG_K1_MODEL, RUNG_K1_EFFORT.
 * Her koşum `eval_runs` tablosuna yazılıyor — iki sürümü karşılaştırmanın
 * tek yolu ikisinin de kayıtlı olması.
 *
 * `app/lib` altındaki modüller doğrudan import ediliyor: ölçülen şey ile
 * çalışan şey aynı kod olmak zorunda. Ayrı bir kopya, ölçtüğün şeyin
 * ürettiğin şey olmadığı anlamına gelir.
 */

import { Client } from "@neondatabase/serverless";

import { RawResponseSchema, validate } from "../app/lib/k1/contract.ts";
import { buildUserMessage, SYSTEM_PROMPT } from "../app/lib/k1/prompt.ts";
import { FakeProvider } from "../app/lib/k1/fake-provider.ts";
import { AnthropicProvider, configuredEffort, configuredModel } from "../app/lib/k1/anthropic-provider.ts";
import { VerdictResponseSchema, validateVerdicts } from "../app/lib/k2/contract.ts";
import { buildVerifyMessage, VERIFY_SYSTEM_PROMPT } from "../app/lib/k2/prompt.ts";
import { PROMPT_VERSION } from "../app/lib/k1/contract.ts";
import { score, total } from "../app/lib/eval/score.ts";
import { analyze as analyzeK0 } from "../app/lib/k0/index.ts";

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const value = (name) => {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : null;
};

const USE_FAKE = has("--fake");
const K1_ONLY = has("--k1-only");
const LIMIT = value("limit") ? Number(value("limit")) : null;
const NOTE = value("note");

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

function provider() {
  if (USE_FAKE) return new FakeProvider();
  return new AnthropicProvider();
}

async function loadGold(client) {
  const items = await client.query(
    `SELECT id::text AS id, level, body FROM gold_items
     WHERE active ORDER BY level, id`
  );
  const expectations = await client.query(
    `SELECT gold_item_id::text AS gold_item_id, subcategory, original, optional
     FROM gold_expectations`
  );

  const byItem = new Map();
  for (const row of expectations.rows) {
    const list = byItem.get(row.gold_item_id) ?? [];
    const start = items.rows.find((i) => i.id === row.gold_item_id).body.indexOf(row.original);
    list.push({
      subcategory: row.subcategory,
      original: row.original,
      start,
      end: start + row.original.length,
      optional: row.optional,
    });
    byItem.set(row.gold_item_id, list);
  }

  const all = items.rows.map((row) => ({
    id: row.id,
    level: row.level,
    body: row.body,
    expectations: byItem.get(row.id) ?? [],
  }));

  return LIMIT ? all.slice(0, LIMIT) : all;
}

async function analyseOne(model, item) {
  const k0 = analyzeK0(item.body);

  const first = await model.complete({
    system: SYSTEM_PROMPT,
    user: buildUserMessage({
      text: item.body,
      level: item.level,
      taskPrompt: null,
      taskHint: null,
      alreadyFound: k0.findings.map((f) => f.original),
    }),
    schema: RawResponseSchema,
  });

  const { findings, rejected } = validate(item.body, first.parsed);
  let cost = first.usage.costUsd;
  let kept = findings;

  if (!K1_ONLY && findings.length > 0) {
    const second = await model.complete({
      system: VERIFY_SYSTEM_PROMPT,
      user: buildVerifyMessage(item.body, findings),
      schema: VerdictResponseSchema,
    });
    cost += second.usage.costUsd;

    const decisions = validateVerdicts(findings.length, second.parsed);
    /*
     * Ölçüme yalnızca DOĞRULANMIŞ bulgular giriyor.
     *
     * Plan §08: "ikinci geçişi geçemeyen bulgu şüpheli olarak işaretli ve
     * istatistiğe girmiyor." Şüpheliyi yanlış alarm saymak ikinci geçişi
     * haksız yere cezalandırır; hata saymak ise ölçümü şişirir. Sayılmıyor.
     */
    kept = findings.filter((_, i) => decisions[i].verdict === "confirmed");
  }

  return { findings: kept, cost, rejected: rejected.length };
}

function pct(x) {
  return `%${(x * 100).toFixed(1)}`;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil.");

  const model = provider();
  const modelId = USE_FAKE ? model.id : configuredModel();
  const effort = USE_FAKE ? "n/a" : configuredEffort();
  const layers = K1_ONLY ? "K1" : "K1+K2";

  const client = new Client(url);
  await client.connect();

  try {
    const gold = await loadGold(client);
    console.log(
      `\nkoşum · ${gold.length} örnek · model ${modelId} · prompt ${PROMPT_VERSION} · çaba ${effort} · katman ${layers}\n`
    );

    const startedAt = Date.now();
    const scores = [];
    const byLevel = new Map(LEVELS.map((l) => [l, []]));
    let totalCost = 0;
    let totalRejected = 0;

    for (const [i, item] of gold.entries()) {
      const result = await analyseOne(model, item);
      const s = score(item.expectations, result.findings);
      scores.push(s);
      byLevel.get(item.level).push(s);
      totalCost += result.cost;
      totalRejected += result.rejected;

      const flag =
        s.falsePositive > 0 ? "YANLIŞ ALARM" : s.falseNegative > 0 ? "kaçırdı" : "";
      process.stdout.write(
        `  ${String(i + 1).padStart(3)}/${gold.length} ${item.level}  ` +
          `beklenen ${s.expected} · bulunan ${s.found} · isabet ${s.truePositive}` +
          (flag ? `  ← ${flag}` : "") +
          "\n"
      );
    }

    const durationMs = Date.now() - startedAt;
    const overall = total(scores);

    console.log("\n─────────── TOPLAM ───────────");
    console.log(`  isabet        ${pct(overall.precision)}`);
    console.log(`  yakalama      ${pct(overall.recall)}`);
    console.log(`  YANLIŞ ALARM  ${pct(overall.falseAlarmRate)}   ← ana ölçüt`);
    console.log(
      `  ${overall.truePositive} doğru · ${overall.falsePositive} yanlış alarm · ${overall.falseNegative} kaçırılan`
    );
    if (overall.categoryMismatch > 0) {
      console.log(`  ${overall.categoryMismatch} bulgu doğru yerde ama yanlış kategoride`);
    }
    if (totalRejected > 0) {
      console.log(`  ${totalRejected} ham bulgu doğrulama katmanında elendi (metinde yok / taksonomi dışı)`);
    }
    console.log(`  maliyet $${totalCost.toFixed(4)} · süre ${(durationMs / 1000).toFixed(1)} sn`);

    console.log("\n─────────── SEVİYE KIRILIMI ───────────");
    console.log("      örnek  isabet  yakalama  yanlış alarm");
    for (const level of LEVELS) {
      const list = byLevel.get(level);
      if (list.length === 0) continue;
      const t = total(list);
      console.log(
        `  ${level}` +
          String(list.length).padStart(6) +
          pct(t.precision).padStart(9) +
          pct(t.recall).padStart(10) +
          pct(t.falseAlarmRate).padStart(14)
      );
    }

    // Koşumu kaydet — karşılaştırma ancak kayıtlıysa mümkün.
    const run = await client.query(
      `INSERT INTO eval_runs (model_id, prompt_version, effort, layers,
         items, expected, found, true_positive, false_positive, false_negative,
         cost_usd, duration_ms, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id::text AS id`,
      [modelId, PROMPT_VERSION, effort, layers, gold.length,
       overall.expected, overall.found, overall.truePositive,
       overall.falsePositive, overall.falseNegative,
       totalCost, durationMs, NOTE]
    );
    const runId = run.rows[0].id;

    for (const level of LEVELS) {
      const list = byLevel.get(level);
      if (list.length === 0) continue;
      const t = total(list);
      await client.query(
        `INSERT INTO eval_run_levels (eval_run_id, level, items, expected,
           true_positive, false_positive, false_negative)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [runId, level, list.length, t.expected, t.truePositive, t.falsePositive, t.falseNegative]
      );
    }

    console.log(`\nkoşum kaydedildi · eval_runs #${runId}\n`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("\nölçüm koşumu çöktü:", error.message);
  process.exitCode = 1;
});
