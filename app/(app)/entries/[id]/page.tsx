import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EntryRow } from "../../../components/EntryRow";

import { K0Panel } from "../../../components/K0Panel";
import { K1Panel } from "../../../components/K1Panel";
import { findingsFor, latestAnalysis } from "../../../lib/analyses";
import { currentLevel } from "../../../lib/k3/store";
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
  // K1 sonucu varsa göster. Yoksa panel "modele sor" düğmesini gösteriyor.
  const level = await currentLevel(user.id);
  const k1 = await latestAnalysis(entry.id, user.id, "K1");
  const k1Findings =
    k1 && k1.status === "ok" ? await findingsFor(k1.id, user.id) : [];

  const earlier = entry.taskId
    ? await previousAttempts(user.id, entry.taskId, entry.id)
    : [];

  return (
    <section className="panel panel-reading">
      <div className="entry-head">
        <span className="chip">{entry.contextName}</span>
        {entry.taskLevel ? <span className="chip">{entry.taskLevel}</span> : null}
        <span className="entry-stamp">{STAMP.format(entry.createdAt)}</span>
      </div>

      <h1 className="panel-title" lang={entry.taskPrompt ? "en" : "tr"}>
        {entry.taskPrompt ?? "Serbest yazı"}
      </h1>
      {entry.taskHint ? <p className="panel-lede">{entry.taskHint}</p> : null}

      <K0Panel text={entry.body} />

      <K1Panel
        entryId={entry.id}
        analysis={k1}
        findings={k1Findings}
        level={level}
      />

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
            <EntryRow key={e.id} entry={e} />
          ))}
        </div>
      ) : null}

      <p className="panel-next">
        Bu metin bir daha değiştirilemez. Yazım, kural ve seviye ölçümü
        <b>modelsiz</b> yapılıyor — aynı metin her zaman aynı sonucu verir.
        Yorum gerektiren hatalar (zaman, ton, eşdizim) model katmanından
        geçiyor ve <b>ikinci bir kez doğrulanıyor</b>; doğrulamayı geçemeyen
        bulgu sana hiç gösterilmiyor.
      </p>

      <p className="auth-alt">
        <Link href="/history">← Geçmişe dön</Link>
      </p>
    </section>
  );
}
