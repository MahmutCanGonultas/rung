import type { Metadata } from "next";
import Link from "next/link";

import { EntryRow } from "../../components/EntryRow";
import { listContexts } from "../../lib/content";
import {
  countEntries,
  listEntries,
  LIST_LIMIT,
  type EntrySummary,
} from "../../lib/entries";
import { requireUser } from "../../lib/guard";

export const metadata: Metadata = { title: "Kayıtlar · Rung" };

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
    if (last && last.label === label) last.entries.push(entry);
    else groups.push({ label, entries: [entry] });
  }

  return groups;
}

/*
 * KAYITLAR — eskiden "Geçmiş".
 *
 * Ad değişti çünkü ekranın gösterdiği şey geçmiş değil, KAYIT: değiştirilemez
 * metinler ve her birinin ölçümü. "Geçmiş" bir arşiv çağrıştırıyor; bu liste
 * ürünün asıl varlığı.
 *
 * Sondaki "kayıtlar değiştirilemez" paragrafı kabuğun altbilgisine taşındı —
 * her ekranda geçerli bir kural, tek bir ekranın dip notu değil.
 */
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
    <section className="log">
      <header className="log-head">
        <h1 className="log-title">Kayıtlar</h1>
        <p className="log-count">
          <b>{totals.entries}</b> kayıt
          <span className="log-sep">·</span>
          <b>{totals.words.toLocaleString("tr-TR")}</b> kelime
          {filtered ? (
            <>
              <span className="log-sep">·</span>
              süzülmüş {entries.length}
            </>
          ) : null}
          {/*
            LİSTE KESİLDİYSE SÖYLENİYOR.
            
            Sorgu en fazla yüz kayıt getiriyor ve bu SESSİZDİ: yüz kırk sekiz
            kaydı olan biri kalan kırk sekize hiçbir yoldan ulaşamıyor, üstelik
            ulaşamadığını da bilmiyordu. Kayıtların değişmezliğiyle övünen bir
            ürünün, sakladığı kayıtları sessizce göstermemesi olmaz.
          */}
          {entries.length >= LIST_LIMIT ? (
            <>
              <span className="log-sep">·</span>
              <span className="log-cut">gösterilen son {LIST_LIMIT}</span>
            </>
          ) : null}
        </p>
      </header>

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
          placeholder="Metinlerde ara"
          aria-label="Kayıtlarda ara"
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
          <div className="log-month" key={group.label}>
            <h2 className="month">
              <span>{group.label}</span>
              <span className="month-scale">100 kelimede bulgu</span>
            </h2>

            {group.entries.map((entry) => (
              /*
                Görev satırı çizilmiyor: on sekiz satırın on sekizinde aynı
                iki görev cümlesi kırpılmış hâlde tekrar ediyordu. Satırı
                ayırt eden şey kişinin KENDİ cümlesi, ve o zaten üstte.
              */
              <EntryRow key={entry.id} entry={entry} hideTask />
            ))}
          </div>
        ))
      )}
    </section>
  );
}
