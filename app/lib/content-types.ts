/*
 * Bağlam ve görev tipleri.
 *
 * `content.ts` bunları yeniden dışa aktarıyor. Ayrı dosyada olmalarının sebebi:
 * `content.ts` `server-only` işaretli ve veritabanına dokunuyor; tipleri
 * birim testlerinden ve istem kurucusundan da kullanmak gerekiyor.
 */

export const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type Level = (typeof LEVELS)[number];

export const DEFAULT_LEVEL: Level = "B1";

export type Context = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

export type Task = {
  id: string;
  contextId: string;
  level: Level;
  prompt: string;
  hint: string;
  minWords: number;
  maxWords: number;
};
