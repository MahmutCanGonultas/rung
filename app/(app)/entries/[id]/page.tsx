import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { K0Panel } from "../../../components/K0Panel";
import { findEntryForUser, previousAttempts } from "../../../lib/entries";
import { requireUser } from "../../../lib/guard";

export const metadata: Metadata = { title: "Kayıt · Rung" };

const STAMP = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

const DAY = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  /*
   * Sahiplik kontrolü sorgunun içinde: `WHERE id = ... AND user_id = ...`.
   * Başkasının kaydı "yasak" değil, **yok** — 403 yerine 404 dönmek, hangi
   * kimliklerin var olduğunu da sızdırmıyor.
   */
  const entry = await findEntryForUser(id, user.id);
  if (!entry) notFound();

  // Aynı göreve daha önce verilmiş cevaplar. `entry.taskId` — kaydın kimliği
  // değil görevin kimliği; ikisini karıştırmak sessizce boş liste döndürürdü.
  const earlier = entry.taskId
    ? await previousAttempts(user.id, entry.taskId, entry.id)
    : [];

  return (
    <section className="panel">
      <div className="entry-head">
        <span className="chip">{entry.contextName}</span>
        {entry.taskLevel ? <span className="chip">{entry.taskLevel}</span> : null}
        <span className="entry-stamp">{STAMP.format(entry.createdAt)}</span>
      </div>

      <h1 className="panel-title">{entry.taskPrompt ?? "Serbest yazı"}</h1>
      {entry.taskHint ? <p className="panel-lede">{entry.taskHint}</p> : null}

      <K0Panel text={entry.body} />

      <dl className="facts">
        <div>
          <dt>Uzunluk</dt>
          <dd>{entry.wordCount} kelime</dd>
        </div>
        <div>
          <dt>Bağlam</dt>
          <dd>{entry.contextName}</dd>
        </div>
        <div>
          <dt>Yazıldığı gün</dt>
          <dd>{DAY.format(entry.createdAt)}</dd>
        </div>
      </dl>

      {earlier.length > 0 ? (
        <div className="earlier">
          <h2 className="earlier-title">Aynı görevi daha önce de yazmışsın</h2>
          {earlier.map((e) => (
            <Link key={e.id} className="entry-row" href={`/entries/${e.id}`}>
              <span className="day">{DAY.format(e.createdAt)}</span>
              <span className="name">{e.taskPrompt}</span>
              <span className="num">{e.wordCount} kelime</span>
            </Link>
          ))}
        </div>
      ) : null}

      <p className="panel-next">
        Bu metin bir daha değiştirilemez. Yukarıdaki ölçüm <b>modelsiz</b>
        yapıldı — aynı metin her zaman aynı sonucu verir. Yorum gerektiren
        hatalar (zaman, ton, eşdizim) model katmanında gelecek.
      </p>

      <p className="auth-alt">
        <Link href="/history">← Geçmişe dön</Link>
      </p>
    </section>
  );
}
