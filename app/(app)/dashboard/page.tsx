import type { Metadata } from "next";
import Link from "next/link";

import { countEntries, listEntries } from "../../lib/entries";
import { requireUser } from "../../lib/guard";

export const metadata: Metadata = { title: "Pano · Rung" };

const DAY = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

export default async function DashboardPage() {
  const user = await requireUser();

  const [totals, recent] = await Promise.all([
    countEntries(user.id),
    listEntries(user.id, { limit: 5 }),
  ]);

  return (
    <section className="panel">
      <h1 className="panel-title">Pano</h1>
      <p className="panel-lede">
        Ölçüm aleti. Yaz, sakla, aylar sonra ne değiştiğine bak.
      </p>

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
            <span>Son kayıtlar</span>
            <span>{recent.length} tane</span>
          </div>
          {recent.map((entry) => (
            <Link key={entry.id} className="entry-row" href={`/entries/${entry.id}`}>
              <span className="day">{DAY.format(entry.createdAt)}</span>
              <span className="name">{entry.taskPrompt ?? "Serbest yazı"}</span>
              <span className="chip">{entry.contextName}</span>
              <span className="num">{entry.wordCount} kelime</span>
            </Link>
          ))}
        </>
      ) : null}

      <p className="panel-next">
        Sıradaki aşama: yazdığın metni model kullanmadan ölçen deterministik
        katman — yazım, kurallar, kelime seviyesi, cümle karmaşıklığı.
      </p>
    </section>
  );
}
