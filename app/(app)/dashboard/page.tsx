import type { Metadata } from "next";
import Link from "next/link";

import { EntryRow } from "../../components/EntryRow";
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
        <div className="level-card">
          <div className="level-head">
            <span className="level-label">Tahmini seviye</span>
            <span className="level-value">{estimate.level}</span>
            <span className="level-score">
              skor {estimate.score.toFixed(2)} / 4
            </span>
          </div>

          <p className="level-lede">
            Sana sorulmadı — <b>ölçüldü</b>. Dördü de deterministik katmandan,
            model kullanılmadan.
          </p>

          <div className="level-signals">
            {estimate.signals.map((signal) => (
              <div key={signal.name} className="level-signal">
                <div className="level-signal-top">
                  <span>{signal.name}</span>
                  <b>{signal.band}</b>
                </div>
                <span className="meter-track">
                  <span
                    className="meter-fill"
                    style={{ width: `${Math.round((signal.value / 4) * 100)}%` }}
                  />
                </span>
                <span className="level-signal-detail">{signal.detail}</span>
              </div>
            ))}
          </div>

          {!estimate.reliable ? (
            <p className="level-warn">
              Son metin kısaydı — tahmin oynak. Birkaç kayıt daha sonra oturuyor.
            </p>
          ) : null}
        </div>
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

      <Notebook notes={notes} open={counts.open} resolved={counts.resolved} />

      <p className="panel-next">
        Listedeki sayı <b>100 kelimede bulgu</b> — uzun ve kısa metinleri
        karşılaştırılabilir yapan tek ölçü. Küçülmesi iyiye gidiş demek.
      </p>
    </section>
  );
}
