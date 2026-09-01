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
import { sentences, words } from "../../../lib/k0/tokenize";
import { partitionFindings } from "../../../lib/k2/display";
import { familyOf } from "../../../lib/taxonomy";
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
            <mark
              key={i}
              className={`read-mark fam-${familyOf(part.finding.subcategory)}`}
            >
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

      {/*
        ══ 4 · BU ÖLÇÜM NASIL ÇIKTI ═════════════════════════════════
        
        Başlık "Ölçüm ayrıntısı"ydı ve içi mühendise yazılmıştı: "skor 2,34 / 4",
        "yan cümle 0,34", "çeşitlilik 0,72", "prompt v1". Ürün sahibi: "bir
        kullanıcının anlayabileceği gibi değil, aşırı profesyonel görünüyor."
        
        Sayılar KALDI — ürünün iddiası ölçtüğünü göstermek, ve gizlenen sayı
        güven vermiyor. Değişen şey her sayının yanında ne anlama geldiğinin
        yazması, ve başlıkların kişinin kendi sorusu olması.
      */}
      <details className="read-detail">
        <summary>Bu ölçüm nasıl çıktı?</summary>
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
            <EntryRow key={e.id} entry={e} hideTask />
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
      <h3 className="detail-h">Seviyeni belirleyen dört şey</h3>
      <p className="detail-note">
        Bu dördüne ayrı ayrı bakılıyor ve seviyen ortalamalarından çıkıyor.
        Hiçbirinde yapay zekâ kullanılmıyor: aynı metin her zaman aynı sonucu
        veriyor. Yazdığın anda ölçüldü, sonradan değişmiyor.
      </p>
      <dl className="lvl">
        {estimate.signals.map((s) => (
          <div key={s.name} className="lvl-row">
            <dt className="lvl-name">
              {s.name}
              {/*
                Sinyal adları motordan geliyor ve doğru adlar — ama tek
                başlarına ne ölçtüklerini söylemiyorlar. Açıklama burada,
                motorda değil: motorun işi ölçmek, ekranın işi anlatmak.
              */}
              {SIGNAL_MEANING[s.name] ? (
                <span className="lvl-what">{SIGNAL_MEANING[s.name]}</span>
              ) : null}
            </dt>
            <dd className="lvl-band">{s.band}</dd>
            <dd className="lvl-detail">{s.detail}</dd>
          </div>
        ))}
      </dl>
      <p className="detail-stamp">
        dördünün ortalaması: {estimate.score.toFixed(2)} / 4
      </p>
    </section>
  );
}

/** Her sinyalin GÜNLÜK DİLDE ne ölçtüğü. Anahtarlar `k3/estimate.ts`ten. */
const SIGNAL_MEANING: Record<string, string> = {
  "Kelime bandı": "Ne kadar ileri seviye kelime kullandığın",
  "Cümle karmaşıklığı": "Cümlelerini ne kadar uzun ve katmanlı kurduğun",
  "Hata yoğunluğu": "Yüz kelimede kaç hata çıktığı",
  "Hata türü": "Hataların temel konularda mı, ince ayrıntılarda mı olduğu",
};

/* ── ayrıntı · ham ölçüler ─────────────────────────────────────────── */
function Metrics({ k0 }: { k0: ReturnType<typeof analyzeK0> }) {
  const m = k0.metrics;
  return (
    <section className="detail-part">
      <h3 className="detail-h">Metnin sayıları</h3>
      <p className="detail-note">
        Yukarıdaki dört şey bu sayılardan hesaplanıyor. Hepsi doğrudan
        yazdığın metinden sayıldı.
      </p>
      <dl className="pairs is-explained">
        <div className="pair">
          <dt>kelime</dt>
          <dd>{m.wordCount}</dd>
        </div>
        <div className="pair">
          <dt>cümle</dt>
          <dd>{m.sentenceCount}</dd>
        </div>
        <div className="pair">
          <dt>cümle başına kelime</dt>
          <dd>{num(m.avgSentenceLength)}</dd>
          <dd className="pair-what">
            Uzun cümle tek başına iyi değil, ama kurabiliyor olmak seviye
            göstergesi.
          </dd>
        </div>
        <div className="pair">
          <dt>yan cümleli cümle oranı</dt>
          <dd>{num(m.subordinationRatio, 2)}</dd>
          <dd className="pair-what">
            &ldquo;…çünkü…&rdquo;, &ldquo;…olduğu için…&rdquo; gibi ikinci bir
            cümle taşıyanların payı. 0,30 demek: her on cümlenin üçü.
          </dd>
        </div>
        <div className="pair">
          <dt>kelime çeşitliliği</dt>
          <dd>
            {m.movingAverageTTR === null ? "—" : num(m.movingAverageTTR, 2)}
          </dd>
          <dd className="pair-what">
            Aynı kelimeyi tekrarlamak yerine kaç farklı kelime kullandığın.
            1&apos;e yakın olması iyi.
          </dd>
        </div>
        <div className="pair">
          <dt>100 kelimede bulgu</dt>
          <dd>{num(k0.findingsPer100Words)}</dd>
          <dd className="pair-what">
            Metinler farklı uzunlukta olduğu için hata SAYISI değil oranı
            karşılaştırılabilir olan.
          </dd>
        </div>
      </dl>
      {!m.reliable ? (
        <p className="detail-note">
          Bu metin kısa olduğu için oranlar oynak — birkaç kelime sayıyı çok
          değiştiriyor. Kırk kelimenin üstünde ölçüm oturuyor.
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
  /*
   * ÖZEL İSİMLER KELİME DAĞARCIĞI DEĞİL.
   *
   * "Mersin", "Türkiye", "Ayşe" — ölçüm bunları bir bandın üstünde sayıp
   * "bu ileri kelimeleri kullanmışsın" diyordu, ve deftere almak için
   * öneriyordu. Bir yer adını bilmek İngilizce kelime bilgisi değil.
   *
   * Eleme yazım katmanındakiyle aynı: cümle başında OLMAYAN büyük harfli
   * kelime özel isim sayılıyor. ASCII dışı harf taşıyanlar da düşüyor —
   * onlar zaten İngilizce kelime değil.
   */
  const cumleBasi = new Set(sentences(text).map((c) => c.start));
  const ozelIsim = (w: { text: string; start: number }) => {
    const ilk = w.text[0];
    if (!ilk || ilk !== ilk.toUpperCase() || !/\p{L}/u.test(ilk)) return false;
    return !cumleBasi.has(w.start);
  };

  const taban = BAND_ORDER.indexOf(level);
  const gorulen = new Set<string>();
  const ustu: Array<{ surface: string; sentence: string }> = [];

  for (const w of words(text)) {
    const key = w.text.toLowerCase();
    if (gorulen.has(key) || yazim.has(key)) continue;
    if (ozelIsim(w)) continue;
    if (/[^\u0000-\u007F]/.test(w.text)) continue;
    gorulen.add(key);
    if (BAND_ORDER.indexOf(bandOf(key)) <= taban) continue;
    ustu.push({
      surface: w.text,
      sentence: text.slice(Math.max(0, w.start - 60), w.start + 60).trim(),
    });
  }

  return (
    <section className="detail-part">
      <h3 className="detail-h">Kullandığın kelimeler hangi seviyeden</h3>
      <p className="detail-note">
        Metindeki her farklı kelime, İngilizcede genelde hangi seviyede
        öğrenildiğine göre sayıldı. Çubuk o dağılımı gösteriyor: soldaki
        başlangıç seviyesi, sağdaki ileri seviye.
      </p>

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
          başlangıç seviyesinin üstünde{" "}
          <b>%{Math.round(bands.aboveBasic * 100)}</b>
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
      <h3 className="detail-h">Bunu kim ölçtü?</h3>
      <p className="detail-note">
        Yazım hataları, temel dilbilgisi kuralları ve seviyen{" "}
        <b>yapay zekâ kullanılmadan</b> bulunuyor — sabit kurallarla, yani aynı
        metin her zaman aynı sonucu veriyor. Yalnızca yorum gerektiren hatalar
        (bir kalıbın Türkçeden geldiğini anlamak gibi) yapay zekâya soruluyor,
        ve gelen her cevap <b>ikinci kez kontrol ediliyor</b>: metinde
        gerçekten bulunmayan bir düzeltme sana hiç gösterilmiyor.
      </p>
      <p className="detail-note">
        Yazdığın metin kaydedildikten sonra değiştirilemiyor. Altı ay sonra
        &ldquo;ilerledim&rdquo; diyebilmen, iki metnin de yazıldığı günkü
        hâliyle durmasına bağlı.
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
