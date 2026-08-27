import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "../../lib/guard";
import { estimateHistory, latestEstimate } from "../../lib/k3/store";
import {
  familyComparison,
  monthlyDensity,
  repeatedTasks,
  stubbornCategories,
} from "../../lib/progress/queries";

export const metadata: Metadata = { title: "İlerleme · Rung" };

/*
 * İlerleme ekranı — plan §08: "'ilerliyor muyum?' sorusunun veriyle cevabı."
 *
 * Grafikler SVG olarak sunucuda çiziliyor: veri zaten sunucuda, ve bir çizim
 * kütüphanesini tarayıcıya indirmek bu kadar basit iki grafik için gereksiz.
 * Sayfa JavaScript olmadan da eksiksiz görünüyor.
 */

const MONTH = new Intl.DateTimeFormat("tr-TR", {
  month: "short",
  year: "2-digit",
  timeZone: "Europe/Istanbul",
});
const DAY = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

const LEVEL_INDEX = ["A1", "A2", "B1", "B2", "C1"];
const num = (x: number, d = 1) => x.toFixed(d).replace(".", ",");

function LevelTrace({
  points,
}: {
  points: Array<{ score: number; createdAt: Date }>;
}) {
  const W = 560;
  const H = 180;
  const L = 34;
  const R = W - 8;
  const T = 14;
  const B = H - 26;

  const x = (i: number) =>
    points.length === 1 ? (L + R) / 2 : L + (i * (R - L)) / (points.length - 1);
  const y = (score: number) => B - (score / 4) * (B - T);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(p.score)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="plot" role="img"
      aria-label="Seviye tahmininin zaman içindeki seyri">
      {LEVEL_INDEX.map((label, i) => (
        <g key={label}>
          <line x1={L} y1={y(i)} x2={R} y2={y(i)} className="plot-grid" strokeWidth="1" />
          <text x={L - 8} y={y(i) + 4} textAnchor="end" className="plot-tick">
            {label}
          </text>
        </g>
      ))}

      <path className="plot-line" d={path} fill="none" strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <circle className="plot-dot" key={i} cx={x(i)} cy={y(p.score)} r="3" />
      ))}

      <text x={L} y={H - 8} className="plot-tick">
        {DAY.format(points[0].createdAt)}
      </text>
      {points.length > 1 ? (
        <text x={R} y={H - 8} textAnchor="end" className="plot-tick">
          {DAY.format(points[points.length - 1].createdAt)}
        </text>
      ) : null}
    </svg>
  );
}

function DensityBars({
  points,
}: {
  points: Array<{ month: Date; per100: number }>;
}) {
  const max = Math.max(...points.map((p) => p.per100), 1);

  return (
    <div className="bars">
      {points.map((p) => (
        <div key={p.month.toISOString()} className="bar-col">
          <span className="bar-val">{num(p.per100)}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ height: `${(p.per100 / max) * 100}%` }} />
          </span>
          <span className="bar-label">{MONTH.format(p.month)}</span>
        </div>
      ))}
    </div>
  );
}

export default async function ProgressPage() {
  const user = await requireUser();

  const [months, families, stubborn, repeats, history, latest] = await Promise.all([
    monthlyDensity(user.id),
    familyComparison(user.id),
    stubbornCategories(user.id),
    repeatedTasks(user.id),
    estimateHistory(user.id),
    latestEstimate(user.id),
  ]);

  if (months.length === 0) {
    return (
      <section className="panel">
        <h1 className="panel-title">İlerleme</h1>
        <p className="empty">
          Henüz veri yok. <Link href="/write">İlk metnini yaz</Link> — ilerleme
          birkaç kayıttan sonra okunabilir hâle geliyor.
        </p>
      </section>
    );
  }

  const first = months[0];
  const last = months[months.length - 1];
  const change =
    first.per100 === 0 ? null : ((last.per100 - first.per100) / first.per100) * 100;
  const singleMonth = months.length === 1;

  return (
    <section className="panel">
      <h1 className="panel-title">İlerleme</h1>
      <p className="panel-lede">
        &quot;İlerliyor muyum?&quot; sorusunun veriyle cevabı. Sayılar 100 kelimede
        oran olarak — daha uzun yazmak kötüleşmek gibi görünmesin diye.
      </p>

      <div className="tiles">
        <div className="tile">
          <div className="tile-label">Tahmini seviye</div>
          <div className="tile-value accent">{latest?.level ?? "—"}</div>
          <div className="tile-note">
            {latest ? `skor ${num(latest.score, 2)} / 4` : "henüz ölçülmedi"}
          </div>
        </div>
        <div className="tile">
          <div className="tile-label">100 kelimede bulgu</div>
          <div className="tile-value">{num(last.per100)}</div>
          <div className="tile-note">
            {singleMonth ? (
              "karşılaştırma için ikinci ay gerekiyor"
            ) : (
              <>
                ilk ay {num(first.per100)} ·{" "}
                <span className={change !== null && change < 0 ? "tone-good" : "tone-bad"}>
                  {change === null ? "—" : `${change > 0 ? "+" : ""}${num(change, 0)}%`}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="tile">
          <div className="tile-label">Kayıt</div>
          <div className="tile-value">
            {months.reduce((n, m) => n + m.entries, 0)}
          </div>
          <div className="tile-note">
            {months.reduce((n, m) => n + m.words, 0).toLocaleString("tr-TR")} kelime
          </div>
        </div>
        <div className="tile">
          <div className="tile-label">Ay</div>
          <div className="tile-value">{months.length}</div>
          <div className="tile-note">
            {MONTH.format(first.month)} → {MONTH.format(last.month)}
          </div>
        </div>
      </div>

      {history.length > 1 ? (
        <>
          <h2 className="section-title">Seviye izi</h2>
          <p className="section-note">
            Her kayıttan sonra yeniden ölçülüyor. Bant değişmese bile skorun
            kayması ilerleme — B1 içinde 1,6&apos;dan 1,9&apos;a çıkmak da sayılıyor.
          </p>
          <LevelTrace points={history} />
        </>
      ) : null}

      <h2 className="section-title">Hata yoğunluğu</h2>
      <p className="section-note">Aya göre, 100 kelimede bulgu sayısı.</p>
      <DensityBars points={months} />

      {families.length > 0 && !singleMonth ? (
        <>
          <h2 className="section-title">Hata ailesi · ilk ay → bu ay</h2>
          <p className="section-note">
            Soluk çubuk nerede başladığın, dolu çubuk bugün. Ölçek dört ailede
            ortak — çubuklar birbiriyle karşılaştırılabilir.
          </p>
          <div className="meters">
            {(() => {
              /*
               * Ölçek BÜTÜN satırlar için ortak. Her satırı kendi maksimumuna
               * göre çizmek görsel bir yalan üretiyordu: aynı değerde biten iki
               * aile farklı uzunlukta çubuk alıyor, okuyan birini daha kötü
               * sanıyordu.
               */
              const scale = Math.max(
                ...families.flatMap((f) => [f.firstMonth, f.lastMonth]),
                0.1
              );
              return families.map((f) => (
                <div key={f.family} className="meter-row">
                  <div className="meter-top">
                    <span className="meter-name">
                      {f.label}
                      {f.stuck ? <span className="meter-flag">▲ azalmıyor</span> : null}
                    </span>
                    <span className="meter-val">
                      {num(f.firstMonth)} → {num(f.lastMonth)}
                    </span>
                  </div>
                  <span className="meter-track">
                    {/* soluk çubuk = başlangıç, dolu çubuk = bugün */}
                    <span
                      className="meter-was"
                      style={{ width: `${(f.firstMonth / scale) * 100}%` }}
                    />
                    <span
                      className={f.stuck ? "meter-fill warn" : "meter-fill"}
                      style={{ width: `${(f.lastMonth / scale) * 100}%` }}
                    />
                  </span>
                </div>
              ));
            })()}
          </div>
        </>
      ) : null}

      {stubborn.length > 0 ? (
        <>
          <h2 className="section-title">İnatçı kategoriler</h2>
          <p className="section-note">
            {stubborn.some((s) => s.recent > 0)
              ? "Hâlâ tekrar eden hatalar, son 30 güne göre sıralı. Bir sonraki tekrar seti buradan üretilecek."
              : "Son 30 günde hiçbiri tekrarlamadı. Aşağıdakiler geçmişteki toplam — çalışılacak taze bir şey yok."}
          </p>
          <div className="stubborn">
            {stubborn.map((s) => (
              <div key={s.subcategory} className="stubborn-row">
                <span className="cat">
                  {s.label}
                  <span>
                    {s.recent > 0
                      ? `son 30 günde ${s.recent} kez`
                      : "son 30 günde tekrarlamadı"}
                  </span>
                </span>
                <span className="n">
                  <b>{s.total}</b>toplam
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {repeats.length > 0 ? (
        <>
          <h2 className="section-title">Aynı görevi tekrar yazdın</h2>
          <p className="section-note">
            İlerlemenin en okunabilir kanıtı: aynı görev, aynı zorluk, farklı
            zaman.
          </p>
          {repeats.map((task) => (
            <div key={task.taskId} className="repeat">
              <div className="repeat-head">
                <span className="chip">{task.level}</span>
                <span className="repeat-prompt">{task.prompt}</span>
              </div>
              {task.attempts.map((attempt, i) => {
                const previous = i > 0 ? task.attempts[i - 1] : null;
                const better = previous !== null && attempt.per100 < previous.per100;
                /*
                 * Kendi sınıfları var. Burada `entry-row` kullanılıyordu ama
                 * ÇOCUKLARI farklıydı (`day`/`name`/`num` yerine
                 * `entry-day`/`entry-main`/`entry-dens`) — yani üç sınıf hiç
                 * biçimlenmiyordu ve on sekiz satırın her biri dört satıra
                 * sarıyordu. `npm run styles` bunu yakaladı.
                 */
                return (
                  <Link
                    key={attempt.entryId}
                    className="try"
                    href={`/entries/${attempt.entryId}`}
                  >
                    <span className="try-day">{DAY.format(attempt.createdAt)}</span>
                    <span className="try-what">
                      {attempt.wordCount} kelime · {attempt.findings} bulgu
                    </span>
                    <span className="try-num">{num(attempt.per100)}</span>
                    <span className="try-delta">
                      {previous === null ? (
                        <span className="tone-flat">ilk</span>
                      ) : (
                        <span className={better ? "tone-good" : "tone-bad"}>
                          {better ? "↓ daha az" : "↑ daha çok"}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </>
      ) : null}
    </section>
  );
}
