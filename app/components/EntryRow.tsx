import Link from "next/link";

import type { EntrySummary } from "../lib/entries";

/*
 * Geçmiş listesinin tek satırı.
 *
 * Yoğunluk çubuğu süs değil: listede ilerlemeyi görünür kılan tek şey.
 * Sadece kelime sayısı gösteren bir liste, altı ay sonra "iyileşiyor muyum"
 * sorusuna cevap vermiyor.
 *
 * Çubuk 100 kelimede bulgu sayısını gösteriyor; 12 ve üstü tam dolu sayılıyor
 * — A1 seviyesinde tipik üst sınır. Ölçek sabit, yoksa iki liste
 * karşılaştırılamaz.
 */

const FULL_SCALE = 12;

const DAY = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Istanbul",
});

export function EntryRow({ entry }: { entry: EntrySummary }) {
  const width =
    entry.per100 === null
      ? 0
      : Math.min(100, (entry.per100 / FULL_SCALE) * 100);

  return (
    <Link className="entry-row" href={`/entries/${entry.id}`}>
      <span className="entry-day">{DAY.format(entry.createdAt)}</span>

      <span className="entry-main">
        <span className="entry-name" lang={entry.taskPrompt ? "en" : "tr"}>
          {entry.taskPrompt ?? "Serbest yazı"}
        </span>
        <span className="entry-meta">
          {entry.contextName} · {entry.wordCount} kelime
        </span>
      </span>

      <span className="entry-dens">
        {entry.per100 === null ? (
          <span className="entry-pending">analiz edilmedi</span>
        ) : (
          <>
            <span className="entry-bar">
              <i style={{ width: `${width}%` }} />
            </span>
            <span className="entry-num">
              {entry.per100.toFixed(1).replace(".", ",")}
            </span>
          </>
        )}
      </span>
    </Link>
  );
}
