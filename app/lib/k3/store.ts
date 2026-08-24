import "server-only";

import { db } from "../db";
import type { Level } from "../content-types";
import { DEFAULT_LEVEL } from "../content-types";
import type { LevelSignal } from "./estimate";

/*
 * Seviye tahminlerinin saklanması ve okunması.
 *
 * Tahmin tek bir kayda değil, kullanıcının SON kayıtlarına bakılarak
 * yapılıyor — tek metin oynak, birkaç metin daha kararlı. Ama her tahmin
 * ayrı satır olarak kalıyor: ilerleme grafiği geçmiş tahminlerden çiziliyor.
 */

export type StoredEstimate = {
  id: string;
  level: Level;
  score: number;
  signals: LevelSignal[];
  reliable: boolean;
  createdAt: Date;
};

export async function saveEstimate(input: {
  userId: string;
  entryId: string | null;
  level: Level;
  score: number;
  signals: LevelSignal[];
  reliable: boolean;
}): Promise<void> {
  await db()`
    INSERT INTO level_estimates (user_id, entry_id, level, score, signals, reliable)
    VALUES (
      ${input.userId}, ${input.entryId}, ${input.level},
      ${input.score.toFixed(3)}, ${JSON.stringify(input.signals)}, ${input.reliable}
    )
  `;
}

export async function latestEstimate(
  userId: string
): Promise<StoredEstimate | null> {
  const rows = (await db()`
    SELECT id::text AS id, level, score, signals, reliable, created_at
    FROM level_estimates
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `) as Array<{
    id: string;
    level: Level;
    score: string;
    signals: LevelSignal[];
    reliable: boolean;
    created_at: Date;
  }>;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    level: row.level,
    score: Number(row.score),
    signals: row.signals,
    reliable: row.reliable,
    createdAt: row.created_at,
  };
}

/**
 * Kullanıcının şu anki seviyesi.
 *
 * Hiç tahmin yoksa varsayılan dönüyor — yeni kullanıcı için bir başlangıç
 * gerekiyor ve sormak plan §06'ya göre güvenilmez.
 */
/*
 * BİR KAYDIN kendi seviye tahmini.
 *
 * `latestEstimate` kullanıcının GÜNCEL seviyesini veriyor; bu ise "şu metin
 * hangi seviyedeydi" sorusunun cevabı. Tahmin kayıt anında o metnin kendi K0
 * sinyallerinden hesaplanıp `entry_id` ile saklanıyordu ama hiçbir ekranda
 * okunmuyordu — veri aylardır oradaydı, gösterimi yoktu.
 *
 * Sahiplik sorgunun içinde: `level_estimates.user_id` ile eşleşmeyen bir
 * kaydın tahmini dönmüyor.
 */
export async function estimateForEntry(
  entryId: string,
  userId: string
): Promise<StoredEstimate | null> {
  const rows = (await db()`
    SELECT id::text AS id, level, score, signals, reliable, created_at
    FROM level_estimates
    WHERE entry_id = ${entryId} AND user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `) as Array<{
    id: string;
    level: Level;
    score: string;
    signals: LevelSignal[];
    reliable: boolean;
    created_at: Date;
  }>;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    level: row.level,
    score: Number(row.score),
    signals: row.signals,
    reliable: row.reliable,
    createdAt: row.created_at,
  };
}

export async function currentLevel(userId: string): Promise<Level> {
  const estimate = await latestEstimate(userId);
  return estimate?.level ?? DEFAULT_LEVEL;
}

export async function estimateHistory(
  userId: string,
  limit = 60
): Promise<StoredEstimate[]> {
  const rows = (await db()`
    SELECT id::text AS id, level, score, signals, reliable, created_at
    FROM level_estimates
    WHERE user_id = ${userId}
    ORDER BY created_at
    LIMIT ${limit}
  `) as Array<{
    id: string;
    level: Level;
    score: string;
    signals: LevelSignal[];
    reliable: boolean;
    created_at: Date;
  }>;

  return rows.map((row) => ({
    id: row.id,
    level: row.level,
    score: Number(row.score),
    signals: row.signals,
    reliable: row.reliable,
    createdAt: row.created_at,
  }));
}
