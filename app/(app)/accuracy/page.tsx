import type { Metadata } from "next";

import { requireUser } from "../../lib/guard";
import {
  objectionCount,
  goldSetSize,
  recentRuns,
  type EvalRun,
} from "../../lib/eval/runs";

export const metadata: Metadata = { title: "Doğruluk · Rung" };

/*
 * Doğruluk panosu — plan §08: "projenin vitrini. Zayıf yer gizlenmez."
 *
 * Ana ölçüt yanlış alarm, yakalama değil (§07). Sıralama bunu yansıtıyor:
 * yanlış alarm ilk kutuda ve vurgulu.
 */

const pct = (x: number) => `%${(x * 100).toFixed(1)}`;

const STAMP = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

function delta(current: number, previous: number | null, lowerIsBetter: boolean) {
  if (previous === null) return null;
  const diff = (current - previous) * 100;
  if (Math.abs(diff) < 0.05) return { text: "değişmedi", tone: "flat" as const };
  const better = lowerIsBetter ? diff < 0 : diff > 0;
  return {
    text: `${diff > 0 ? "+" : ""}${diff.toFixed(1)} puan`,
    tone: better ? ("good" as const) : ("bad" as const),
  };
}

function Tile({
  label,
  value,
  note,
  accent,
  change,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
  change?: { text: string; tone: "good" | "bad" | "flat" } | null;
}) {
  return (
    <div className="tile">
      <div className="tile-label">{label}</div>
      <div className={accent ? "tile-value accent" : "tile-value"}>{value}</div>
      <div className="tile-note">
        {note}
        {change ? (
          <>
            {note ? " · " : ""}
            <span className={`tone-${change.tone}`}>{change.text}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function RunPanel({ run, previous }: { run: EvalRun; previous: EvalRun | null }) {
  /*
   * Maliyet bu ekranda YOK. Ölçüm koşumunun kaç dolara mal olduğu ürünü
   * işleten kişinin sorunu; ürünü kullanan kişinin ekranında yeri yok. Sayı
   * `analyses.cost_usd` ve `eval_runs.cost_usd` sütunlarında duruyor ve
   * `npm run eval` çıktısında yazıyor — kaybolmadı, sadece kullanıcıya
   * gösterilmiyor.
   *
   * Boşalan yere en zayıf seviye geldi: sayfanın asıl iddiası "zayıf yer
   * gizlenmez" ve bunu bir dolar rakamından çok daha iyi taşıyor.
   */
  const weakest = [...run.levels].sort((a, b) => a.recall - b.recall)[0];

  return (
    <>
      <div className="view-bar">
        <span className="chip">{run.modelId}</span>
        <span className="chip">prompt {run.promptVersion}</span>
        <span className="chip">çaba {run.effort}</span>
        <span className="chip">{run.layers}</span>
        <span className="run-stamp">{STAMP.format(run.createdAt)}</span>
      </div>

      <div className="tiles">
        <Tile
          label="Yanlış alarm · ana ölçüt"
          value={pct(run.falseAlarmRate)}
          accent
          change={delta(run.falseAlarmRate, previous?.falseAlarmRate ?? null, true)}
          note={`${run.falsePositive} bulgu`}
        />
        <Tile
          label="Yakalama"
          value={pct(run.recall)}
          change={delta(run.recall, previous?.recall ?? null, false)}
          note={`${run.falseNegative} kaçırıldı`}
        />
        <Tile
          label="İsabet"
          value={pct(run.precision)}
          change={delta(run.precision, previous?.precision ?? null, false)}
          note={`${run.truePositive} / ${run.found}`}
        />
        <Tile
          label="En zayıf seviye"
          value={weakest ? weakest.level : "—"}
          note={weakest ? `yakalama ${pct(weakest.recall)}` : undefined}
        />
      </div>

      <h2 className="section-title">Seviye kırılımı</h2>
      <p className="section-note">
        Tek ortalama sayı gerçeği gizler — plan §06. Her seviye iki ayrı
        şekilde bozulabiliyor: olmayan hatayı göstermek (isabet düşer) ve
        gerçek hatayı kaçırmak (yakalama düşer). İkisi de ayrı çiziliyor.
      </p>

      <div className="meters">
        {run.levels.map((level) => {
          /*
           * Bir seviye iki ayrı şekilde zayıf olabiliyor ve ikisi aynı şey
           * değil: çok yanlış alarm (olmayan hatayı gösteriyor) ya da düşük
           * yakalama (gerçek hatayı kaçırıyor).
           *
           * Önceden bayrak sadece yanlış alarma bakıyor, çubuk sadece isabeti
           * çiziyordu. Sonuç: yakalaması %66.7 olan bir seviye tam yeşil ve
           * bayraksız görünüyordu — yani bu sayfa tam da gizlememeye söz
           * verdiği şeyi gizliyordu. İki çubuk da çiziliyor artık.
           */
          const noisy = level.falseAlarmRate > 0.1;
          const missing = level.recall < 0.85;
          const weak = noisy || missing;
          const why = noisy && missing
            ? "yanlış alarm + kaçırma"
            : noisy
              ? "yanlış alarm"
              : "kaçırma";

          return (
            <div key={level.level} className="meter-row">
              <div className="meter-top">
                <span className="meter-name">
                  {level.level}
                  {weak ? <span className="meter-flag">▲ {why}</span> : null}
                </span>
                <span className="meter-sub">{level.items} örnek</span>
              </div>

              <div className="pair">
                <span className="pair-key">isabet</span>
                <span className="meter-track">
                  <span
                    className={noisy ? "meter-fill warn" : "meter-fill"}
                    style={{ width: `${Math.round(level.precision * 100)}%` }}
                  />
                </span>
                <span className="pair-val">{pct(level.precision)}</span>
              </div>

              <div className="pair">
                <span className="pair-key">yakalama</span>
                <span className="meter-track">
                  <span
                    className={missing ? "meter-fill warn" : "meter-fill"}
                    style={{ width: `${Math.round(level.recall * 100)}%` }}
                  />
                </span>
                <span className="pair-val">{pct(level.recall)}</span>
              </div>

              <div className="meter-sub">
                yanlış alarm {pct(level.falseAlarmRate)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default async function AccuracyPage() {
  await requireUser();

  const [runs, gold, objections] = await Promise.all([
    recentRuns(6),
    goldSetSize(),
    objectionCount(),
  ]);

  const latest = runs[0] ?? null;
  const previous = runs[1] ?? null;

  return (
    <section className="panel">
      <h1 className="panel-title">Doğruluk</h1>
      <p className="panel-lede">
        %100 doğruluk mümkün değil — dil modelleri olasılıksal çalışır. Bunu
        garanti eden herkes yanılıyor. Yapılabilecek şey <b>ölçmek</b>, ve zayıf
        yeri gizlememek.
      </p>

      {latest === null ? (
        <p className="empty">
          Henüz ölçüm koşumu yok. <code>npm run eval</code> ile çalıştırılıyor.
        </p>
      ) : (
        <RunPanel run={latest} previous={previous} />
      )}

      <h2 className="section-title">Altın küme</h2>
      <div className="tiles">
        <Tile label="Örnek" value={String(gold.items)} note={`${gold.expectations} beklenen hata`} />
        <Tile
          label="Hatasız metin"
          value={String(gold.clean)}
          note="yanlış alarm bunlarla ölçülüyor"
        />
        <Tile
          label="İtirazdan gelen"
          value={String(gold.fromFeedback)}
          note={`${objections} itiraz kaydedildi`}
        />
      </div>

      {runs.length > 1 ? (
        <>
          <h2 className="section-title">Koşum geçmişi</h2>
          <p className="section-note">
            İki sürümü karşılaştırmak, ikisinin de kayıtlı olmasını gerektiriyor.
            Model, prompt sürümü ve çaba her satırda yazıyor — biri eksikse
            &quot;daha iyi&quot; cümlesi neyin daha iyi olduğunu söylemiyor.
            Taklit modelle yapılan duman testleri bu listede yok: onlar ölçüm
            değil, ölçüm aracının kendi kontrolü.
          </p>
          <div className="table-scroll">
            <table className="runs">
            <thead>
              <tr>
                <th>tarih</th>
                <th>model</th>
                <th>prompt</th>
                <th>katman</th>
                <th>yanlış alarm</th>
                <th>yakalama</th>
                <th>isabet</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td>{STAMP.format(run.createdAt)}</td>
                  <td>{run.modelId}</td>
                  <td>{run.promptVersion}</td>
                  <td>{run.layers}</td>
                  <td>{pct(run.falseAlarmRate)}</td>
                  <td>{pct(run.recall)}</td>
                  <td>{pct(run.precision)}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </>
      ) : null}

      <h2 className="section-title">Beş savunma</h2>
      <div className="defences">
        {[
          ["01 · ölç", "Altın küme", "Hataları önceden bilinen paragraflar. Bir kısmı bilerek hatasız — yanlış alarm ancak öyle ölçülür. Kesin sayılar yukarıdaki karolarda."],
          ["02 · daralt", "Şema zorlaması", "Modele açık uçlu soru sorulmuyor. Sabit kategori, zorunlu şema."],
          ["03 · ayır", "Deterministik önce", "Yazım ve temel kurallar modelsiz. Modele sadece yorum gerektiren kısım gidiyor."],
          ["04 · doğrula", "İkinci geçiş", "Her bulguya bağımsız olarak 'bu gerçekten hata mı' soruluyor — gerekçesi gösterilmeden."],
          ["05 · dinle", "İtiraz döngüsü", "Katılmadığın her düzeltme kaydediliyor; elle gözden geçirilip altın kümeye yanlış alarm örneği olarak ekleniyor."],
        ].map(([n, title, text]) => (
          <div key={n} className="defence">
            <div className="defence-n">{n}</div>
            <div className="defence-t">{title}</div>
            <div className="defence-w">{text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
