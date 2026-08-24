import type { CSSProperties } from "react";

import { analyze } from "../../lib/k0";
import { segment } from "../../lib/k0/segments";
import { labelOf } from "../../lib/taxonomy";

/*
 * Vitrin analizi.
 *
 * ÖNEMLİ: burada gösterilen bulgular MAKET DEĞİL. Metin gerçek K0 motorundan
 * geçiyor ve çıkan ne ise o gösteriliyor. Kurallar değişirse bu sayfa da
 * değişir — yani vitrin, ürünün gerçekten yaptığı şeyi göstermek zorunda.
 *
 * Model çağrısı yok: her açılışta aynı sonuç çıkıyor ve sayfanın açılması
 * hiçbir dış servise bağlı değil.
 *
 * İKİ YERLEŞİM:
 *   card  anasayfa — okuma ve raf tek bir kutunun içinde
 *   flat  giriş ekranı — ikisi ızgaranın DOĞRUDAN çocuğu oluyor
 *
 * `flat` şart, çünkü giriş ekranında raf kartın altından TAM GENİŞLİKTE
 * geçmek zorunda. `.sample` içinde kalırsa geçemiyor: `.sample`ın
 * `overflow: hidden`ı yeni bir blok biçimlendirme bağlamı açıyor ve ızgara
 * öğesi olarak tek şeritten geniş olamıyor. `display: contents` de çözüm
 * değil — `InView.tsx` sebebini zaten yazıyor.
 */

const SAMPLE =
  "I am agree with your suggestion about the meeting of tomorrow. " +
  "Thanks for the informations you sent me, i recieved them yesterday.";

export function SampleAnalysis({
  layout = "card",
}: {
  layout?: "card" | "flat";
}) {
  const { findings } = analyze(SAMPLE);
  const parts = segment(SAMPLE, findings);

  /*
   * Hareketin ritmi GERÇEK VERİDEN geliyor: `--n` bulgu sayısı, `--i` her
   * bulgunun metindeki sırası. Bir K0 kuralı değişip sayı beşten dörde inerse
   * dizinin temposu da onunla değişiyor — sahne değil, ölçümün kendisi.
   *
   * `--n` okuma şeridinde duruyor; özel özellikler miras kaldığı için raf da
   * onu görüyor.
   */
  const read = (
    <div
      className="sample-read"
      style={{ "--n": String(findings.length) } as CSSProperties}
    >
      <div className="sample-head">
        <span className="sample-tag">K0 · deterministik · model yok</span>
        <span className="sample-count">{findings.length} bulgu</span>
      </div>

      <p className="sample-text" lang="en">
        {parts.map((part, i) =>
          part.kind === "plain" ? (
            <span key={i}>{part.text}</span>
          ) : (
            <mark
              key={i}
              className="sample-mark"
              style={{ "--i": String(part.index) } as CSSProperties}
            >
              {part.text}
              <sup>{part.index + 1}</sup>
            </mark>
          )
        )}
      </p>
    </div>
  );

  const shelf = (
    <div className="sample-findings">
      {findings.map((finding, i) => (
        <div
          key={`${finding.start}-${i}`}
          className="sample-finding"
          style={{ "--i": String(i) } as CSSProperties}
        >
          <div className="sample-kind">
            <span className="sample-no">{i + 1}</span>
            {labelOf(finding.subcategory)}
          </div>
          <div className="sample-fix" lang="en">
            <span className="was">{finding.original}</span>
            {finding.suggestion ? (
              <>
                <span className="arrow">→</span>
                <span className="now">{finding.suggestion}</span>
              </>
            ) : null}
          </div>
          <p className="sample-why">{finding.explanation}</p>
        </div>
      ))}
    </div>
  );

  if (layout === "flat") {
    return (
      <>
        {read}
        {shelf}
      </>
    );
  }

  return (
    <div className="sample">
      {read}
      {shelf}
    </div>
  );
}
