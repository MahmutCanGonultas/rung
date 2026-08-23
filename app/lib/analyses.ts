import "server-only";

import { db } from "./db";
import type { Finding, Subcategory } from "./taxonomy";

/*
 * Analiz koşumlarının ve bulguların saklanması.
 *
 * `entries.ts` ile aynı kural: her okuma `userId`'yi sorgunun WHERE'ine
 * koyuyor. Bulgular kaydın üzerinden kullanıcıya bağlı, o yüzden JOIN
 * zinciri her sorguda kuruluyor.
 */

export type StoredAnalysis = {
  id: string;
  layer: "K0" | "K1" | "K2";
  modelId: string | null;
  promptVersion: string | null;
  status: "ok" | "failed";
  error: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  durationMs: number | null;
  createdAt: Date;
};

export type StoredFinding = Finding & {
  id: string;
  analysisId: string;
  verdict: "confirmed" | "rejected" | "uncertain" | null;
  /** Kullanıcı bu bulguya ne dedi: true kabul, false itiraz, null cevapsız. */
  agreed: boolean | null;
};

export async function saveAnalysis(input: {
  entryId: string;
  layer: "K0" | "K1" | "K2";
  modelId: string | null;
  promptVersion: string | null;
  status: "ok" | "failed";
  error: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  durationMs: number | null;
  findings: Finding[];
}): Promise<string> {
  const rows = (await db()`
    INSERT INTO analyses (
      entry_id, layer, model_id, prompt_version, status, error,
      input_tokens, output_tokens, cost_usd, duration_ms
    ) VALUES (
      ${input.entryId}, ${input.layer}, ${input.modelId}, ${input.promptVersion},
      ${input.status}, ${input.error},
      ${input.inputTokens}, ${input.outputTokens}, ${input.costUsd}, ${input.durationMs}
    )
    RETURNING id::text AS id
  `) as Array<{ id: string }>;

  const analysisId = rows[0].id;

  /*
   * Bulgular tek tek yazılıyor. Kayıt başına en fazla 20 bulgu var
   * (şemadaki `maxItems`), o yüzden toplu yazma karmaşıklığına değmiyor.
   * Sayı büyürse burası tek bir çok satırlı INSERT'e döner.
   */
  for (const finding of input.findings) {
    await db()`
      INSERT INTO findings (
        analysis_id, entry_id, subcategory, start_offset, end_offset,
        original, suggestion, explanation, confidence, layer
      ) VALUES (
        ${analysisId}, ${input.entryId}, ${finding.subcategory},
        ${finding.start}, ${finding.end},
        ${finding.original}, ${finding.suggestion}, ${finding.explanation},
        ${finding.confidence}, ${finding.layer}
      )
    `;
  }

  return analysisId;
}

export async function latestAnalysis(
  entryId: string,
  userId: string,
  layer: "K1" | "K2"
): Promise<StoredAnalysis | null> {
  const rows = (await db()`
    SELECT a.id::text AS id, a.layer, a.model_id, a.prompt_version, a.status,
           a.error, a.input_tokens, a.output_tokens, a.cost_usd,
           a.duration_ms, a.created_at
    FROM analyses a
    JOIN entries e ON e.id = a.entry_id
    WHERE a.entry_id = ${entryId}
      AND e.user_id = ${userId}
      AND a.layer = ${layer}
    ORDER BY a.created_at DESC
    LIMIT 1
  `) as Array<{
    id: string;
    layer: "K0" | "K1" | "K2";
    model_id: string | null;
    prompt_version: string | null;
    status: "ok" | "failed";
    error: string | null;
    input_tokens: number | null;
    output_tokens: number | null;
    cost_usd: string | null;
    duration_ms: number | null;
    created_at: Date;
  }>;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    layer: row.layer,
    modelId: row.model_id,
    promptVersion: row.prompt_version,
    status: row.status,
    error: row.error,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    // NUMERIC sürücüden metin olarak geliyor — sayıya çevrilmesi gerekiyor.
    costUsd: row.cost_usd === null ? null : Number(row.cost_usd),
    durationMs: row.duration_ms,
    createdAt: row.created_at,
  };
}

export async function findingsFor(
  analysisId: string,
  userId: string
): Promise<StoredFinding[]> {
  const rows = (await db()`
    SELECT f.id::text AS id, f.analysis_id::text AS analysis_id, f.subcategory,
           f.start_offset, f.end_offset, f.original, f.suggestion,
           f.explanation, f.confidence, f.layer, f.verdict,
           fb.agreed
    FROM findings f
    JOIN entries e ON e.id = f.entry_id
    LEFT JOIN finding_feedback fb
      ON fb.finding_id = f.id AND fb.user_id = e.user_id
    WHERE f.analysis_id = ${analysisId}
      AND e.user_id = ${userId}
    ORDER BY f.start_offset
  `) as Array<{
    id: string;
    analysis_id: string;
    subcategory: Subcategory;
    start_offset: number;
    end_offset: number;
    original: string;
    suggestion: string | null;
    explanation: string;
    confidence: number;
    layer: "K0" | "K1";
    verdict: "confirmed" | "rejected" | "uncertain" | null;
    agreed: boolean | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    analysisId: row.analysis_id,
    subcategory: row.subcategory,
    start: row.start_offset,
    end: row.end_offset,
    original: row.original,
    suggestion: row.suggestion,
    explanation: row.explanation,
    confidence: row.confidence,
    layer: row.layer,
    verdict: row.verdict,
    agreed: row.agreed,
  }));
}
