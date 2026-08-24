import type { Level } from "../lib/content-types";
import { BAND_ORDER, bandOf } from "../lib/k0/bands";
import { analyze } from "../lib/k0";
import { words } from "../lib/k0/tokenize";
import { NoteWordButton } from "./NoteWordButton";
import { segment } from "../lib/k0/segments";
import { labelOf } from "../lib/taxonomy";

/*
 * K0 şeridi ve bulgular.
 *
 * Sunucu bileşeni — analiz sunucuda çalışıyor, tarayıcıya sadece sonucu
 * gösteren HTML iniyor. Sözlük (~1 MB) hiçbir zaman inmiyor.
 *
 * Bu katmanda model yok: aynı metin her açılışta aynı sonucu veriyor, o yüzden
 * sonucu veritabanında saklamaya da gerek yok. Model katmanı (K1/K2) tersi —
 * o koşumun sonucu, kullanılan prompt sürümüyle birlikte `analyses` tablosunda
 * saklanıyor, çünkü aynı metin ikinci koşumda başka cevap verebilir.
 */

function pct(x: number): string {
  return `%${Math.round(x * 100)}`;
}

/*
 * Sadece boşluktan oluşan bir "hatalı metin" ekranda hiç görünmüyor —
 * noktalamadan önceki fazla boşluk bulgusunda tam olarak bu oluyordu.
 * Boşlukları görünür bir işaretle gösteriyoruz.
 */
function visible(text: string): string {
  return text.replace(/ /g, "␣").replace(/\n/g, "⏎");
}

function num(x: number, digits = 1): string {
  return x.toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function K0Panel({
  text,
  entryId,
  level,
  noted,
}: {
  text: string;
  entryId: string;
  /* Kullanıcının ölçülmüş seviyesi — kelimenin bandı değil. */
  level: Level;
  /** Deftere alınmış kelimeler. */
  noted: Set<string>;
}) {
  const result = analyze(text);
  const { metrics, bands, findings } = result;
  const parts = segment(text, findings);

  return (
    <>
      <div className="k0">
        <span className="k0-tag">K0 · deterministik</span>
        <span className="k0-m">
          <b>{metrics.wordCount}</b> kelime · <b>{metrics.sentenceCount}</b> cümle
        </span>
        <span className="k0-sep">│</span>
        <span className="k0-m">
          ort. <b>{num(metrics.avgSentenceLength)}</b> kelime
        </span>
        <span className="k0-sep">│</span>
        <span className="k0-m">
          yan cümle <b>{num(metrics.subordinationRatio, 2)}</b>
        </span>
        <span className="k0-sep">│</span>
        <span className="k0-m">
          çeşitlilik{" "}
          <b>
            {metrics.movingAverageTTR === null
              ? "—"
              : num(metrics.movingAverageTTR, 2)}
          </b>
        </span>
        <span className="k0-sep">│</span>
        <span className="k0-m">
          100 kelimede <b>{num(result.findingsPer100Words)}</b> bulgu
        </span>
      </div>

      {!metrics.reliable ? (
        <p className="k0-warn">
          Metin kısa — oranlar oynak. Kırk kelimenin üstünde ölçüm oturuyor.
        </p>
      ) : null}

      <article className="entry-body" lang="en">
        {parts.map((part, i) =>
          part.kind === "plain" ? (
            <span key={i}>{part.text}</span>
          ) : (
            <mark key={i} className="mark-finding">
              {part.text}
              <sup>{part.index + 1}</sup>
            </mark>
          )
        )}
      </article>

      <div className="bands">
        <div className="bands-head">Kelime bandı dağılımı · farklı kelimeler</div>
        <div className="bands-bar" role="img" aria-label="Kelime bandı dağılımı">
          {(["A1", "A2", "B1", "B2", "C1"] as const).map((band) =>
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
        <div className="bands-legend">
          {(["A1", "A2", "B1", "B2", "C1"] as const).map((band) => (
            <span key={band} className="bands-item">
              <i className={`bands-dot band-${band}`} />
              {band} <b>{bands.counts[band]}</b>
            </span>
          ))}
          <span className="bands-item bands-above">
            temel bandın üstü <b>{pct(bands.aboveBasic)}</b>
          </span>
        </div>

        <OwnWords
          text={text}
          level={level}
          entryId={entryId}
          noted={noted}
          spelling={new Set(
            findings
              .filter((f) => f.subcategory === "spelling")
              .map((f) => f.original.toLowerCase())
          )}
        />
      </div>

      <div className="findings">
        <div className="findings-head">
          Bulgular · {findings.length === 0 ? "yok" : `${findings.length} tane`}
        </div>

        {findings.length === 0 ? (
          <p className="empty">
            Deterministik katman bir şey bulamadı. Bu &quot;hatasız&quot; demek
            değil — yazım, temel kurallar ve sabit kalıplar temiz demek. Yorum
            gerektiren hatalar model katmanının işi.
          </p>
        ) : (
          findings.map((finding, i) => (
            <div key={`${finding.start}-${i}`} className="finding">
              <div className="finding-kind">
                <span className="finding-no">{i + 1}</span>
                {labelOf(finding.subcategory)}
                <span className="finding-conf">
                  güven {num(finding.confidence, 2)}
                </span>
              </div>
              <div className="finding-fix" lang="en">
                <span className="was">{visible(finding.original)}</span>
                {finding.suggestion ? (
                  <>
                    <span className="arrow">→</span>
                    <span className="now">{finding.suggestion}</span>
                  </>
                ) : null}
              </div>
              <p className="finding-why">{finding.explanation}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}

/*
 * Kendi yazdığın, bandının üstündeki kelimeler.
 *
 * Neden burada: bir kelimeyi KULLANMAK, onu bildiğin anlamına gelmiyor —
 * insan yarım bildiği kelimeyi de yazıyor. "Bunu doğru mu kullandım?" sorusu
 * en çok burada çıkıyor.
 *
 * Yazım hatası olarak işaretlenen kelimeler dışarıda: "recieved" bir kelime
 * bilgisi değil, `bands.ts` de aynı sebeple onları ölçüm dışında tutuyor.
 *
 * `<details>` içinde kapalı duruyor — kayıt sayfasının asıl işi bulgular.
 */
function OwnWords({
  text,
  level,
  entryId,
  noted,
  spelling,
}: {
  text: string;
  /* Kullanıcının ölçülmüş seviyesi — kelimenin bandı değil. */
  level: Level;
  entryId: string;
  noted: Set<string>;
  spelling: Set<string>;
}) {
  const floor = BAND_ORDER.indexOf(level);
  const seen = new Set<string>();
  const above: Array<{ surface: string; sentence: string }> = [];

  for (const w of words(text)) {
    const key = w.text.toLowerCase();
    if (seen.has(key) || spelling.has(key)) continue;
    seen.add(key);
    if (BAND_ORDER.indexOf(bandOf(key)) <= floor) continue;

    const around = text.slice(Math.max(0, w.start - 60), w.start + 60).trim();
    above.push({ surface: w.text, sentence: around });
  }

  if (above.length === 0) return null;

  return (
    <details className="ownwords">
      <summary>
        Bu metinde <b>{level}</b> bandının üstünde {above.length} kelime
        kullanmışsın
      </summary>
      <p className="ownwords-note">
        Kullanmak bilmek değil. Emin olmadığın varsa deftere al — bant listesi
        elle derlendi ve <b>C1</b> burada &quot;listede yok&quot; demek.
      </p>
      <div className="offband-words">
        {above.slice(0, 12).map((w) => (
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
    </details>
  );
}
