import type { Finding } from "../taxonomy.ts";

/*
 * Metni, bulguların işaretlendiği parçalara böler.
 *
 * Ekranda metnin altını çizebilmek için gereken tek şey bu: hangi aralık
 * hangi bulguya ait. Bulgular çakışmıyor (`dedupeOverlaps` garanti ediyor),
 * o yüzden tek geçişte bölünebiliyor.
 */

export type Segment =
  | { kind: "plain"; text: string }
  | { kind: "finding"; text: string; finding: Finding; index: number };

export function segment(text: string, findings: Finding[]): Segment[] {
  const ordered = [...findings].sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let cursor = 0;

  ordered.forEach((finding, index) => {
    if (finding.start > cursor) {
      out.push({ kind: "plain", text: text.slice(cursor, finding.start) });
    }
    out.push({
      kind: "finding",
      text: text.slice(finding.start, finding.end),
      finding,
      index,
    });
    cursor = finding.end;
  });

  if (cursor < text.length) {
    out.push({ kind: "plain", text: text.slice(cursor) });
  }

  return out;
}
