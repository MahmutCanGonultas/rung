import "server-only";
import { log } from "../log";

import { db } from "../db";
import { AnthropicProvider, hasApiKey } from "../k1/anthropic-provider";
import { FakeProvider } from "../k1/fake-provider";
import { ProviderError, type Provider } from "../k1/provider";
import type { Finding } from "../taxonomy";
import {
  VERIFY_PROMPT_VERSION,
  VerdictResponseSchema,
  validateVerdicts,
  type RawVerdictResponse,
} from "./contract";
import { buildVerifyMessage, VERIFY_SYSTEM_PROMPT } from "./prompt";

/*
 * K2 koşumu.
 *
 * K1'in bulgularını alır, her birine "bu gerçekten hata mı" sorar ve kararı
 * `findings.verdict` sütununa yazar.
 *
 * Kararın anlamı:
 *   confirmed → hata sayılır, istatistiğe girer
 *   rejected  → kullanıcıya hiç gösterilmez
 *   uncertain → ŞÜPHELİ olarak gösterilir ama istatistiğe GİRMEZ
 *
 * Üçüncüsü planın açık talebi (§08): "ikinci geçişi geçemeyen bulgu şüpheli
 * olarak işaretli ve istatistiğe girmiyor." Ne hata sayılıyor ne yanlış alarm.
 */

function pickProvider(): Provider {
  if (process.env.RUNG_FAKE_MODEL === "1") return new FakeProvider();
  return new AnthropicProvider();
}

export type VerifyOutcome =
  | {
      ok: true;
      confirmed: number;
      rejected: number;
      uncertain: number;
      costUsd: number;
    }
  | { ok: false; reason: string };

export async function runK2(input: {
  text: string;
  findings: Array<Finding & { id: string }>;
}): Promise<VerifyOutcome> {
  if (input.findings.length === 0) {
    return { ok: true, confirmed: 0, rejected: 0, uncertain: 0, costUsd: 0 };
  }

  if (!hasApiKey() && process.env.RUNG_FAKE_MODEL !== "1") {
    return { ok: false, reason: "İkinci geçiş için API anahtarı gerekiyor." };
  }

  let provider: Provider;
  try {
    provider = pickProvider();
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Sağlayıcı kurulamadı.",
    };
  }

  try {
    const result = await provider.complete({
      system: VERIFY_SYSTEM_PROMPT,
      user: buildVerifyMessage(input.text, input.findings),
      schema: VerdictResponseSchema,
    });

    const decisions = validateVerdicts(
      input.findings.length,
      result.parsed as RawVerdictResponse
    );

    const tally = { confirmed: 0, rejected: 0, uncertain: 0 };

    for (const decision of decisions) {
      const finding = input.findings[decision.index];
      if (!finding) continue;

      await db()`
        UPDATE findings
        SET verdict = ${decision.verdict}
        WHERE id = ${finding.id}
      `;

      tally[decision.verdict] += 1;
    }

    return { ok: true, ...tally, costUsd: result.usage.costUsd };
  } catch (error) {
    const reason =
      error instanceof ProviderError
        ? error.message
        : "İkinci geçiş başarısız oldu.";
    log.error("k2_failed", error, { findings: input.findings.length });
    return { ok: false, reason };
  }
}
