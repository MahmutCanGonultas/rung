/*
 * `"use server"` dosyaları yalnızca async fonksiyon dışa aktarabiliyor;
 * tip ve sabit ayrı dosyada duruyor. `app/lib/form-state.ts` ile aynı sebep.
 */

export type SaveState = {
  error: string | null;
  body: string;
};

export const EMPTY_SAVE_STATE: SaveState = { error: null, body: "" };
