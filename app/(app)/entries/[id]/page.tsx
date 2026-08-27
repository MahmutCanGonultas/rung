import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AutoAnalyze } from "../../../components/AutoAnalyze";
import { EntryRow } from "../../../components/EntryRow";
import { FixRow } from "../../../components/FixRow";
import { NoteWordButton } from "../../../components/NoteWordButton";
import { analyzeEntryAction } from "../../../lib/analysis-actions";
import { findingsFor, latestAnalysis } from "../../../lib/analyses";
import { findEntryForUser, previousAttempts } from "../../../lib/entries";
import { requireUser } from "../../../lib/guard";
import { analyze as analyzeK0 } from "../../../lib/k0";
import { BAND_ORDER, bandOf } from "../../../lib/k0/bands";
import { segment } from "../../../lib/k0/segments";
import { words } from "../../../lib/k0/tokenize";
import { partitionFindings } from "../../../lib/k2/display";
import { filterForLevel, limitFor } from "../../../lib/k3/filter";
import { currentLevel, estimateForEntry } from "../../../lib/k3/store";
import { mergeFindings } from "../../../lib/findings-merge";
import { notedWords } from "../../../lib/vocab/notes";

export const metadata: Metadata = { title: "Kayıt · Rung" };

/*
 * KAYIT — ölçümün okunduğu ekran.
 *
 * Bu sayfa baştan kuruldu. Önceki hâli, yazan kişiye sırayla şunları
 * gösteriyordu: "skor 1.95 / 4" → "K0 · DETERMİNİSTİK 36 kelime · yan cümle
 * 0,00 · çeşitlilik —" → kelime bandı dağılımı → "BULGULAR · YOK" → "K1 ·
 * MODEL ÇIKARIMI" → "Modele sor" düğmesi. Sekiz blok telemetri, ve asıl
 * gelinen şey — hatalar — bir düğmenin arkasında.
 *
 * Bunlar aletin PARÇA ADLARI. Yazan kişinin sorusu tek: ne yanlış?
 *
 * YENİ SIRA, o soruya göre:
 *   1  metnin kendisi, hataları üstünde işaretli
 *   2  tek satır hüküm: kaç bulgu, hangi seviye
 *   3  bulgular — tek liste, kural ve model bir arada
 *   4  ölçüm ayrıntısı — hepsi TEK katlanır kutunun içinde
 *
 * Ölçüm KENDİLİĞİNDEN başlıyor. Deterministik bulgular zaten ilk çizimde
 * ekranda; model katmanı arkadan gelip aynı listeye ekleniyor.
 */

const STAMP = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

const num = (x: number, d = 1) =>
  x.toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d });

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  /*
   * Sahiplik kontrolü sorgunun içinde: `WHERE id = ... AND user_id = ...`.
   * Başkasının kaydı "yasak" değil, YOK — 403 yerine 404 dönmek hangi
   * kimliklerin var olduğunu da sızdırmıyor.
   */
  const entry = await findEntryForUser(id, user.id);
  if (!entry) notFound();

  const [level, noted, k1, earlier, written] = await Promise.all([
    currentLevel(user.id),
    notedWords(user.id),
    latestAnalysis(entry.id, user.id, "K1"),
    entry.taskId
      ? previousAttempts(user.id, entry.taskId, entry.id)
      : Promise.resolve([]),
    // BU METNİN kendi seviyesi — kullanıcının güncel seviyesi değil.
    estimateForEntry(entry.id, user.id),
  ]);

  const k1Findings =
    k1 && k1.status === "ok" ? await findingsFor(k1.id, user.id) : [];

  /*
   * Deterministik katman burada, istekte çalışıyor. Model yok, yani aynı metin
   * her açılışta aynı sonucu veriyor ve saklamaya gerek yok. Sözlük (~1 MB)
   * tarayıcıya hiç inmiyor.
   */
  const k0 = analyzeK0(entry.body);

  /*
   * İkinci geçişin reddettikleri atılıyor, kalanlar seviyeye göre süzülüyor.
   * Plan §04: "A1'in cümlesinde on hata vardır; onuncusunu da yüzüne vurursan
   * uygulamayı siler." Süzgeç aynı, gösterimi değişti — eskiden iki ayrı
   * paragraf hangi bulgunun neden gizlendiğini anlatıyordu; artık tek satır.
   */
  const bolum = partitionFindings(k1Findings);
  const seviyeSuzgeci = filterForLevel(bolum.visible, level);
  const gurultu = seviyeSuzgeci.hidden.length - seviyeSuzgeci.overLimit;

  const bulgular = mergeFindings(k0.findings, seviyeSuzgeci.shown);
  const parcalar = segment(entry.body, bulgular);

  const olcum = k1 === null;
  const basarisiz = k1?.status === "failed";

  return (
    <article className="read">
      <p className="read-meta">
        <span>{STAMP.format(entry.createdAt)}</span>
        <span>{entry.contextName}</span>
        {/*
          Etiketsiz bir "B1" rozeti iki farklı şeyi anlatabiliyor: GÖREVİN
          zorluğu mu, METNİN ölçümü mü. İkisi de bu sayfada, o yüzden ikisi de
          etiketli.
        */}
        {entry.taskLevel ? <span>Görev {entry.taskLevel}</span> : null}
      </p>

      <h1 className="read-task" lang={entry.taskPrompt ? "en" : "tr"}>
        {entry.taskPrompt ?? "Serbest yazı"}
      </h1>
      {entry.taskHint ? <p className="read-hint">{entry.taskHint}</p> : null}

      {/* ══ 1 · METNİN KENDİSİ ══════════════════════════════════════ */}
      <div className="read-text" lang="en">
        {parcalar.map((part, i) =>
          part.kind === "plain" ? (
            <span key={i}>{part.text}</span>
          ) : (
            <mark key={i} className="read-mark">
              <a href={`#b${part.index + 1}`}>
                {part.text}
                <sup>{part.index + 1}</sup>
              </a>
            </mark>
          )
        )}
      </div>

      {/* ══ 2 · TEK SATIR HÜKÜM ═════════════════════════════════════ */}
      <p className="read-verdict">
        <b>{bulgular.length}</b> bulgu
        {written ? (
          <>
            {" · bu metin "}
            <b className="read-level">{written.level}</b>
            {!written.reliable ? (
              <span className="read-soft"> (metin kısa, tahmin oynak)</span>
            ) : null}
          </>
        ) : null}
      </p>

      {/* Model katmanı: kendiliğinden başlıyor, durumu buraya yazıyor. */}
      {olcum || basarisiz ? (
        <AutoAnalyze
          entryId={entry.id}
          action={analyzeEntryAction}
          auto={olcum}
        />
      ) : null}
      {basarisiz ? (
        <p className="run-error" role="alert">
          Son deneme başarısız oldu: {k1?.error}
        </p>
      ) : null}

      {/* ══ 3 · BULGULAR — TEK LİSTE ════════════════════════════════ */}
      {bulgular.length === 0 ? (
        <p className="read-clean">
          {olcum
            ? "Kural katmanı bir şey bulamadı. Model katmanı hâlâ bakıyor."
            : bolum.filtered > 0
              ? `Bir şey bulunamadı. Model ${bolum.filtered} aday üretmişti, ikinci geçiş hepsini eledi — metin bu seviyede temiz.`
              : "Bir şey bulunamadı. Metin bu seviyede temiz."}
        </p>
      ) : (
        <ol className="fixes">
          {bulgular.map((finding, i) => (
            <FixRow
              key={`${finding.layer}-${finding.start}-${i}`}
              finding={finding}
              index={i}
              entryId={entry.id}
              noted={noted}
              open={i === 0}
            />
          ))}
        </ol>
      )}

      {/*
        Süzgecin sesi TEK SATIR. Eskiden iki paragraf vardı: biri seviyeye göre
        elenenleri, diğeri sıraya girmeyenleri anlatıyordu. Bilgi duruyor,
        hacmi düştü.
      */}
      {seviyeSuzgeci.hidden.length > 0 || bolum.filtered > 0 ? (
        <p className="read-filtered">
          {level} seviyesine göre en fazla {limitFor(level)} bulgu gösteriliyor.
          {gurultu > 0 ? ` ${gurultu} bulgu bu seviyede gürültü sayıldı.` : ""}
          {seviyeSuzgeci.overLimit > 0
            ? ` ${seviyeSuzgeci.overLimit} bulgu önemli ama sıraya girmedi.`
            : ""}
          {bolum.filtered > 0
            ? ` ${bolum.filtered} aday ikinci geçişte elendi.`
            : ""}
        </p>
      ) : null}

      {/* ══ 4 · ÖLÇÜM AYRINTISI — hepsi tek kutuda ══════════════════ */}
      <details className="read-detail">
        <summary>Ölçüm ayrıntısı</summary>
        <div className="detail-body">
          <Signals estimate={written} />
          <Metrics k0={k0} />
          <Bands k0={k0} text={entry.body} level={level} entryId={entry.id} noted={noted} />
          <Provenance k1={k1} />
        </div>
      </details>

      {earlier.length > 0 ? (
        <section className="earlier">
          <h2 className="earlier-title">Aynı görevi daha önce de yazmışsın</h2>
          {earlier.map((e) => (
            <EntryRow key={e.id} entry={e} />
          ))}
        </section>
      ) : null}

      <p className="read-back">
        <Link href="/history">← Kayıtlara dön</Link>
      </p>
    </article>
  );
}

/* ── ayrıntı · seviyeyi üreten dört sinyal ─────────────────────────── */
function Signals({
  estimate,
}: {
  estimate: Awaited<ReturnType<typeof estimateForEntry>>;
}) {
  if (!estimate) {
    return (
      <p className="detail-none">
        Bu kaydın seviyesi ölçülmedi — seviye motorundan önce yazılmış ya da o
        koşum başarısız olmuş. Uydurulmuş bir bant göstermek yerine söylüyoruz.
      </p>
    );
  }

  return (
    <section className="detail-part">
      <h3 className="detail-h">
        Seviye · skor {estimate.score.toFixed(2)} / 4
      </h3>
      <p className="detail-note">
        Dördü de deterministik katmandan, model kullanılmadan. Kaydedildiği anda
        ölçüldü, sonradan değişmiyor.
      </p>
      <dl className="lvl">
        {estimate.signals.map((s) => (
          <div key={s.name} className="lvl-row">
            <dt className="lvl-name">{s.name}</dt>
            <dd className="lvl-band">{s.band}</dd>
            <dd className="lvl-detail">{s.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ── ayrıntı · ham ölçüler ─────────────────────────────────────────── */
function Metrics({ k0 }: { k0: ReturnType<typeof analyzeK0> }) {
  const m = k0.metrics;
  return (
    <section className="detail-part">
      <h3 className="detail-h">Ham ölçüler</h3>
      <dl className="pairs">
        <div className="pair">
          <dt>kelime</dt>
          <dd>{m.wordCount}</dd>
        </div>
        <div className="pair">
          <dt>cümle</dt>
          <dd>{m.sentenceCount}</dd>
        </div>
        <div className="pair">
          <dt>ort. cümle</dt>
          <dd>{num(m.avgSentenceLength)}</dd>
        </div>
        <div className="pair">
          <dt>yan cümle</dt>
          <dd>{num(m.subordinationRatio, 2)}</dd>
        </div>
        <div className="pair">
          <dt>çeşitlilik</dt>
          <dd>
            {m.movingAverageTTR === null ? "—" : num(m.movingAverageTTR, 2)}
          </dd>
        </div>
        <div className="pair">
          <dt>100 kelimede</dt>
          <dd>{num(k0.findingsPer100Words)}</dd>
        </div>
      </dl>
      {!m.reliable ? (
        <p className="detail-note">
          Metin kısa — oranlar oynak. Kırk kelimenin üstünde ölçüm oturuyor.
        </p>
      ) : null}
    </section>
  );
}

/* ── ayrıntı · kelime bandı ve bandın üstündeki kelimeler ──────────── */
function Bands({
  k0,
  text,
  level,
  entryId,
  noted,
}: {
  k0: ReturnType<typeof analyzeK0>;
  text: string;
  level: (typeof BAND_ORDER)[number];
  entryId: string;
  noted: Set<string>;
}) {
  const { bands, findings } = k0;

  /*
   * Kendi yazdığın, kendi bandının üstündeki kelimeler. Bir kelimeyi
   * KULLANMAK onu bildiğin anlamına gelmiyor — yarım bilinen kelime de
   * yazılıyor. Yazım hatası olarak işaretlenenler dışarıda: "recieved" bir
   * kelime bilgisi değil.
   */
  const yazim = new Set(
    findings.filter((f) => f.subcategory === "spelling").map((f) => f.original.toLowerCase())
  );
  const taban = BAND_ORDER.indexOf(level);
  const gorulen = new Set<string>();
  const ustu: Array<{ surface: string; sentence: string }> = [];

  for (const w of words(text)) {
    const key = w.text.toLowerCase();
    if (gorulen.has(key) || yazim.has(key)) continue;
    gorulen.add(key);
    if (BAND_ORDER.indexOf(bandOf(key)) <= taban) continue;
    ustu.push({
      surface: w.text,
      sentence: text.slice(Math.max(0, w.start - 60), w.start + 60).trim(),
    });
  }

  return (
    <section className="detail-part">
      <h3 className="detail-h">Kelime bandı · farklı kelimeler</h3>

      <div className="bands-bar" role="img" aria-label="Kelime bandı dağılımı">
        {BAND_ORDER.map((band) =>
          bands.counts[band] === 0 ? null : (
            <span
              key={band}
              className={`bands-slice band-${band}`}
              style={{ width: `${bands.shares[band] * 100}%` }}
              title={`${band}: ${bands.counts[band]} kelime`}
            />
          )
        )}
      </div>

      <ul className="bands-legend">
        {BAND_ORDER.map((band) => (
          <li key={band} className="bands-item">
            <i className={`bands-dot band-${band}`} />
            {band} <b>{bands.counts[band]}</b>
          </li>
        ))}
        <li className="bands-item bands-above">
          temel bandın üstü <b>%{Math.round(bands.aboveBasic * 100)}</b>
        </li>
      </ul>

      {ustu.length > 0 ? (
        <>
          <p className="detail-note">
            Bu metinde <b>{level}</b> bandının üstünde {ustu.length} kelime
            kullanmışsın. Kullanmak bilmek değil — emin olmadığın varsa deftere
            al.
          </p>
          <div className="offband-words">
            {ustu.slice(0, 12).map((w) => (
              <NoteWordButton
                key={w.surface}
                surface={w.surface}
                source="entry"
                anchorId={entryId}
                snippet={w.sentence}
                back={`/entries/${entryId}`}
                noted={noted.has(w.surface.toLowerCase())}
                compact
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

/* ── ayrıntı · bu ölçümü ne üretti ─────────────────────────────────── */
function Provenance({
  k1,
}: {
  k1: Awaited<ReturnType<typeof latestAnalysis>>;
}) {
  return (
    <section className="detail-part">
      <h3 className="detail-h">Bu ölçümü ne üretti</h3>
      <p className="detail-note">
        Yazım, temel kurallar ve seviye ölçümü <b>modelsiz</b> yapılıyor — aynı
        metin her zaman aynı sonucu verir. Yorum gerektiren hatalar model
        katmanından geçiyor ve <b>ikinci bir kez doğrulanıyor</b>; doğrulamayı
        geçemeyen bulgu sana hiç gösterilmiyor. Kaydedilen metin bir daha
        değiştirilemez.
      </p>
      {k1?.status === "ok" ? (
        <p className="detail-stamp">
          {k1.modelId} · prompt {k1.promptVersion}
          {k1.durationMs !== null ? ` · ${k1.durationMs} ms` : ""}
        </p>
      ) : null}
    </section>
  );
}
