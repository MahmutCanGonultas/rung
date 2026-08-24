import type { Metadata } from "next";
import Link from "next/link";

import { EntryRow } from "../../components/EntryRow";
import { listContexts } from "../../lib/content";
import { countEntries, listEntries, type EntrySummary } from "../../lib/entries";
import { requireUser } from "../../lib/guard";

export const metadata: Metadata = { title: "Geçmiş · Rung" };

const MONTH = new Intl.DateTimeFormat("tr-TR", {
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

/* Kayıtlar zaten tarihe göre sıralı geliyor; aylara bölmek tek geçişte. */
function groupByMonth(entries: EntrySummary[]) {
  const groups: Array<{ label: string; entries: EntrySummary[] }> = [];

  for (const entry of entries) {
    const label = MONTH.format(entry.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.entries.push(entry);
    } else {
      groups.push({ label, entries: [entry] });
    }
  }

  return groups;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; context?: string }>;
}) {
  const user = await requireUser();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const contextSlug = params.context?.trim() ?? "";

  const [contexts, entries, totals] = await Promise.all([
    listContexts(),
    listEntries(user.id, {
      search: search || undefined,
      contextSlug: contextSlug || undefined,
    }),
    countEntries(user.id),
  ]);

  const filtered = search.length > 0 || contextSlug.length > 0;
  const groups = groupByMonth(entries);

  return (
    <section className="panel">
      <h1 className="panel-title">Geçmiş</h1>

      {/*
        Düz bir GET formu: JavaScript kapalıyken de çalışıyor, sonuç adres
        çubuğunda duruyor, geri tuşu ve yer imi doğru davranıyor.
      */}
      <form className="filters" action="/history" method="get">
        <input
          className="input"
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Metinlerde ara — örn. deposit"
          aria-label="Geçmişte ara"
        />

        <select
          className="input pick"
          name="context"
          defaultValue={contextSlug}
          aria-label="Bağlam"
        >
          <option value="">Bağlam: hepsi</option>
          {contexts.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <button className="btn" type="submit">
          Süz
        </button>

        {filtered ? (
          <Link className="btn btn-quiet" href="/history">
            Temizle
          </Link>
        ) : null}
      </form>

      <p className="totals">
        <b>{totals.entries}</b> kayıt · <b>{totals.words.toLocaleString("tr-TR")}</b> kelime
        {filtered ? ` · süzülmüş sonuç: ${entries.length}` : ""}
      </p>

      {entries.length === 0 ? (
        <p className="empty">
          {filtered ? (
            <>
              Bu süzgeçle kayıt yok. <Link href="/history">Süzgeci temizle</Link>.
            </>
          ) : (
            <>
              Henüz kayıt yok. <Link href="/write">İlk metnini yaz</Link>.
            </>
          )}
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.label}>
            <div className="month">
              <span>
                {group.label} · {group.entries.length} kayıt
              </span>
              <span>100 kelimede bulgu</span>
            </div>

            {group.entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        ))
      )}

      <p className="panel-next">
        Kayıtlar <b>değiştirilemez</b>. Altı ay sonraki karşılaştırmanın doğru
        olmasının tek yolu bu — sonradan düzeltilen metin ilerleme grafiğini
        sessizce yalancı yapar.
      </p>
    </section>
  );
}
