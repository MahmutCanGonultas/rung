import "server-only";

import { db } from "../db";

/*
 * Ölçüm koşumlarının okunması.
 *
 * Koşumlar kullanıcıya ait değil, sisteme ait — doğruluk panosu ürünün
 * vitrini (plan §08) ve herkes aynı sayıyı görüyor. Sayfa yine de giriş
 * arkasında, çünkü v1'de tek kullanıcı var.
 */

export type LevelBreakdown = {
  level: string;
  items: number;
  expected: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  precision: number;
  recall: number;
  falseAlarmRate: number;
};

export type EvalRun = {
  id: string;
  modelId: string;
  promptVersion: string;
  effort: string;
  layers: string;
  items: number;
  expected: number;
  found: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  costUsd: number | null;
  durationMs: number | null;
  note: string | null;
  createdAt: Date;
  precision: number;
  recall: number;
  falseAlarmRate: number;
  levels: LevelBreakdown[];
};

function rates(row: {
  found: number;
  expected: number;
  true_positive: number;
  false_positive: number;
  false_negative: number;
}) {
  return {
    precision: row.found === 0 ? 1 : row.true_positive / row.found,
    recall:
      row.expected === 0
        ? 1
        : (row.expected - row.false_negative) / row.expected,
    falseAlarmRate: row.found === 0 ? 0 : row.false_positive / row.found,
  };
}

export async function recentRuns(limit = 5): Promise<EvalRun[]> {
  const runs = (await db()`
    SELECT id::text AS id, model_id, prompt_version, effort, layers,
           items, expected, found, true_positive, false_positive,
           false_negative, cost_usd, duration_ms, note, created_at
    FROM eval_runs
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as Array<{
    id: string;
    model_id: string;
    prompt_version: string;
    effort: string;
    layers: string;
    items: number;
    expected: number;
    found: number;
    true_positive: number;
    false_positive: number;
    false_negative: number;
    cost_usd: string | null;
    duration_ms: number | null;
    note: string | null;
    created_at: Date;
  }>;

  if (runs.length === 0) return [];

  const ids = runs.map((r) => r.id);
  const levels = (await db()`
    SELECT eval_run_id::text AS eval_run_id, level, items, expected,
           true_positive, false_positive, false_negative
    FROM eval_run_levels
    WHERE eval_run_id = ANY(${ids}::bigint[])
    ORDER BY level
  `) as Array<{
    eval_run_id: string;
    level: string;
    items: number;
    expected: number;
    true_positive: number;
    false_positive: number;
    false_negative: number;
  }>;

  return runs.map((row) => ({
    id: row.id,
    modelId: row.model_id,
    promptVersion: row.prompt_version,
    effort: row.effort,
    layers: row.layers,
    items: row.items,
    expected: row.expected,
    found: row.found,
    truePositive: row.true_positive,
    falsePositive: row.false_positive,
    falseNegative: row.false_negative,
    costUsd: row.cost_usd === null ? null : Number(row.cost_usd),
    durationMs: row.duration_ms,
    note: row.note,
    createdAt: row.created_at,
    ...rates(row),
    levels: levels
      .filter((l) => l.eval_run_id === row.id)
      .map((l) => ({
        level: l.level,
        items: l.items,
        expected: l.expected,
        truePositive: l.true_positive,
        falsePositive: l.false_positive,
        falseNegative: l.false_negative,
        ...rates({ ...l, found: l.true_positive + l.false_positive }),
      })),
  }));
}

export async function goldSetSize(): Promise<{
  items: number;
  clean: number;
  expectations: number;
  fromFeedback: number;
}> {
  const rows = (await db()`
    SELECT
      count(*)::int                                            AS items,
      count(*) FILTER (WHERE e.n IS NULL)::int                 AS clean,
      coalesce(sum(e.n), 0)::int                               AS expectations,
      count(*) FILTER (WHERE g.source = 'feedback')::int       AS from_feedback
    FROM gold_items g
    LEFT JOIN (
      SELECT gold_item_id, count(*)::int AS n
      FROM gold_expectations GROUP BY gold_item_id
    ) e ON e.gold_item_id = g.id
    WHERE g.active
  `) as Array<{
    items: number;
    clean: number;
    expectations: number;
    from_feedback: number;
  }>;

  const row = rows[0];
  return {
    items: row.items,
    clean: row.clean,
    expectations: row.expectations,
    fromFeedback: row.from_feedback,
  };
}

/** Kullanıcı itirazları — altın kümeyi büyütecek ham veri. */
export async function disagreementCount(): Promise<number> {
  const rows = (await db()`
    SELECT count(*)::int AS n FROM finding_feedback WHERE agreed = false
  `) as Array<{ n: number }>;
  return rows[0].n;
}
