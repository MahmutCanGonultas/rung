/* `"use server"` dosyaları sadece async fonksiyon dışa aktarabiliyor. */

export type AnalysisState = {
  error: string | null;
  ok: boolean;
};

export const EMPTY_ANALYSIS_STATE: AnalysisState = { error: null, ok: false };
