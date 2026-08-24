import type { Metadata } from "next";
import Link from "next/link";

import { EntryRow } from "../../components/EntryRow";
import { LevelCard } from "../../components/LevelCard";
import { Notebook } from "../../components/Notebook";
import { countEntries, listEntries } from "../../lib/entries";
import { listNotes, noteCounts } from "../../lib/vocab/notes";
import { requireUser } from "../../lib/guard";
import { latestEstimate } from "../../lib/k3/store";

export const metadata: Metadata = { title: "Pano · Rung" };

const DAY = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

export default async function DashboardPage() {
  const user = await requireUser();

  const [totals, recent, estimate, notes, counts] = await Promise.all([
    countEntries(user.id),
    listEntries(user.id, { limit: 5 }),
    latestEstimate(user.id),
    listNotes(user.id, 8),
    noteCounts(user.id),
  ]);

  return (
    <section className="panel">
      <h1 className="panel-title">Pano</h1>
      <p className="panel-lede">
        Ölçüm aleti. Yaz, sakla, aylar sonra ne değiştiğine bak.
      </p>

      {estimate ? (
        <LevelCard
          estimate={estimate}
          label="Tahmini seviye"
          lede="Sana sorulmadı — ölçüldü. Dördü de deterministik katmandan, model kullanılmadan."
          warn="Son metin kısaydı — tahmin oynak. Birkaç kayıt daha sonra oturuyor."
        />
      ) : null}

      <dl className="facts">
        <div>
          <dt>Kayıt</dt>
          <dd>{totals.entries}</dd>
        </div>
        <div>
          <dt>Toplam kelime</dt>
          <dd>{totals.words.toLocaleString("tr-TR")}</dd>
        </div>
        <div>
          <dt>Katılım</dt>
          <dd>{DAY.format(user.createdAt)}</dd>
        </div>
      </dl>

      <div className="cta-row">
        <Link className="btn btn-primary" href="/write">
          Yazmaya başla
        </Link>
        {totals.entries > 0 ? (
          <Link className="btn" href="/history">
            Geçmişi gör
          </Link>
        ) : null}
      </div>

      {recent.length > 0 ? (
        <>
          <div className="month">
            <span>Son kayıtlar · {recent.length} tane</span>
            <span>100 kelimede bulgu</span>
          </div>
          {recent.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </>
      ) : null}

      {/* Açıklama listenin hemen altında: defterin arkasına düşerse neyi
          anlattığı belirsizleşiyor. */}
      <p className="panel-next">
        Listedeki sayı <b>100 kelimede bulgu</b> — uzun ve kısa metinleri
        karşılaştırılabilir yapan tek ölçü. Küçülmesi iyiye gidiş demek.
      </p>

      <Notebook notes={notes} open={counts.open} resolved={counts.resolved} />

    </section>
  );
}
