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
import { discardDraftAction } from "../../lib/draft-actions";
import { listDrafts } from "../../lib/drafts";
import { requireUser } from "../../lib/guard";

export const metadata: Metadata = { title: "Kayıtlar · Rung" };

const MONTH = new Intl.DateTimeFormat("tr-TR", {
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

/* Taslak satırında gün ve saat: "yarım kalan" için ay yetmiyor. */
const DAY = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
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

  const [contexts, entries, totals, drafts] = await Promise.all([
    listContexts(),
    listEntries(user.id, {
      search: search || undefined,
      contextSlug: contextSlug || undefined,
    }),
    countEntries(user.id),
    listDrafts(user.id),
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
        TASLAKLAR — kayıtların ÜSTÜNDE, ve onlardan ayrı.
        
        Aynı listeye karıştırılmadılar ve bu bilerek: kayıt değiştirilemez ve
        ölçülmüştür, taslak ikisi de değil. Yan yana dizmek, ürünün en sert
        kuralını ("kayıtlar değiştirilemez") görsel olarak bulandırırdı.
        
        Süzgeç bunları süzmüyor: taslakların ölçümü yok, yani arayacak bir
        bulgusu da yok. Filtreli görünümde de duruyorlar, çünkü yarım kalmış
        bir iş süzgeçten bağımsız olarak seni bekliyor.
      */}
      {drafts.length > 0 ? (
        <section className="drafts" aria-labelledby="taslaklar-h">
          <h2 className="drafts-h" id="taslaklar-h">
            Yarım kalanlar <span className="drafts-n">{drafts.length}</span>
          </h2>
          <ul className="draft-list">
            {drafts.map((d) => (
              <li key={d.id} className="draft-row">
                <Link
                  className="draft-open"
                  href={
                    d.taskId
                      ? `/write?context=${d.contextSlug}&task=${d.taskId}`
                      : "/write?context=own"
                  }
                >
                  <span className="draft-where">
                    {d.taskPrompt ?? "Kendi konum"}
                  </span>
                  {/* İlk satır: hangi taslak olduğunu ayıran tek şey kişinin
                      kendi cümlesi — kayıt listesindeki `snippet` ile aynı
                      gerekçe. */}
                  <span className="draft-snip" lang="en">
                    {d.body.slice(0, 120)}
                    {d.body.length > 120 ? "…" : ""}
                  </span>
                </Link>
                <span className="draft-meta">
                  <time dateTime={d.updatedAt.toISOString()}>
                    {DAY.format(d.updatedAt)}
                  </time>
                </span>
                {/*
                  Silme kendi formunda: `<form>` içine `<form>` konamıyor ve
                  bir bağlantı (GET) veri silmemeli.
                */}
                <form action={discardDraftAction}>
                  <input type="hidden" name="taskId" value={d.taskId ?? ""} />
                  <button className="draft-drop" type="submit">
                    Sil
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
