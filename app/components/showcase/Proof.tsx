import type { CSSProperties } from "react";

import { pct } from "../../lib/eval/format";
import { recentRuns } from "../../lib/eval/runs";

/*
 * Ölçülen doğruluk — vitrinin en önemli parçası.
 *
 * Sayılar SABİT DEĞİL: en son ölçüm koşumundan okunuyor. Yani `npm run eval`
 * çalıştığında bu sayfa da güncelleniyor. Bir ürünün "doğruluğumu ölçüyorum"
 * demesi ile ölçtüğü sayıyı ön sayfada göstermesi arasındaki fark bu.
 *
 * Hiç koşum yoksa bölüm çizilmiyor — uydurma sayı göstermektense hiç
 * göstermemek doğru.
 */

export async function Proof({
  compact = false,
  layout = "card",
}: {
  compact?: boolean;
  /*
   * `flat`: parçalar ızgaranın DOĞRUDAN çocuğu oluyor. Anasayfada itiraf
   * şeridi kendi zeminine ve kendi genişliğine geçmek zorunda; kap içinde
   * kalırsa geçemiyor. `SampleAnalysis` ile aynı kalıp, aynı gerekçe.
   */
  layout?: "card" | "flat";
} = {}) {
  let run;
  try {
    [run] = await recentRuns(1);
  } catch {
    return null;
  }
  if (!run) return null;

  /*
   * İSABET HÜCRESİ SİLİNDİ ve sayı kaybolmadı, çünkü zaten yeni bir şey
   * söylemiyordu: `isabet = truePositive / found` ve `yanlış alarm =
   * falsePositive / found`, toplamları tanım gereği 1. Yani İsabet, sayfanın
   * en büyük sayısının çıkarma işlemiydi.
   *
   * Görünen sonuç daha da kötüydü: bu koşumda İsabet ile Yakalama tesadüfen
   * ikisi de %95,1 çıkıp yan yana duruyor ve kopyala-yapıştır hatası gibi
   * görünüyordu.
   *
   * Kayıp KAPATILDI: `run.found` (payda) yalnız o hücrenin notunda yazıyordu,
   * artık ana ölçütün notunda. Ham "39 / 41" sayısı Doğruluk ekranında,
   * kendi karosunda duruyor.
   */
  const recall = run.expected === 0 ? 1 : (run.expected - run.falseNegative) / run.expected;
  const falseAlarm = run.found === 0 ? 0 : run.falsePositive / run.found;

  const inner = (
    <>
      <div className="proof-grid">
        {/*
          Hücrenin altındaki çubuk oranın KENDİSİ: %4,9 yanlış alarm gerçekten
          hücrenin %4,9'unu kaplıyor. Sayıyı sıfırdan yukarı saydıran bir sayaç
          YOK — o, yarım saniye boyunca ekranda ölçülmemiş sayı göstermek olurdu
          ve bu ürünün tek cümlelik kimliği tam olarak onu yapmamak.
        */}
        <div className="proof-cell is-lead" style={{ "--i": "0" } as CSSProperties}>
          <span className="proof-label">Yanlış alarm</span>
          <span className="proof-value">{pct(falseAlarm)}</span>
          <span className="proof-note">
            ana ölçüt · {run.found} bulgunun {run.falsePositive}&rsquo;si
          </span>
          <i
            className="proof-fill"
            aria-hidden="true"
            style={{ "--v": String(falseAlarm) } as CSSProperties}
          />
        </div>
        <div className="proof-cell" style={{ "--i": "1" } as CSSProperties}>
          <span className="proof-label">Yakalama</span>
          <span className="proof-value">{pct(recall)}</span>
          <span className="proof-note">{run.expected} beklenen hata</span>
          <i
            className="proof-fill"
            aria-hidden="true"
            style={{ "--v": String(recall) } as CSSProperties}
          />
        </div>
        {/*
          Burada eskiden kayıt başı dolar maliyeti vardı. Ziyaretçinin ilgisini
          çeken şey o değil; sayının neye dayandığı: %95 neyin üstünde ölçülmüş?

          Etiket "altın küme" DEĞİL, "ölçülen örnek". `eval_runs.items` bu
          koşumun kaç örnek puanladığı; altın kümenin bugünkü boyutu değil.
          `--limit` ile koşulmuş ya da sonradan büyümüş bir kümede ikisi
          ayrışıyor, ve aynı Türkçe başlığı iki farklı sayı için kullanmak tam
          olarak bu sayfanın karşı durduğu şey olurdu. Kümenin canlı boyutu
          Doğruluk ekranında, kendi başlığı altında.

          Oran değil SAYI — paydası olmayan şeye orantılı çubuk çizilmiyor.
        */}
        <div className="proof-cell" style={{ "--i": "2" } as CSSProperties}>
          <span className="proof-label">Ölçülen örnek</span>
          <span className="proof-value">{run.items}</span>
          <span className="proof-note">altın kümeden</span>
        </div>
      </div>


      {/*
        ZAYIF YER ARTIK VİTRİNDE DEĞİL — bant kırılımı da, en kötü sayıyı
        adlandıran cümle de burada değil.

        Ürün sahibinin kararı (25 Ağustos 2026): en kötü sayının herkese açık
        yüzeylerde durmasına gerek yok. ÖLÇÜM KAYBOLMUYOR — seviye kırılımı
        Doğruluk ekranında tam hâliyle, `eval_run_levels` tablosunda ve
        `npm run eval` çıktısında duruyor. Değişen tek şey ilk karşılaşma.

        Bu, plan §08'in "zayıf yer gizlenmez" maddesini vitrin için geri alıyor;
        madde ürünün kendi panosu için geçerliliğini koruyor. §15 bunu
        gerekçesiyle kaydediyor.
      */}

      {compact ? null : (
        <p className="proof-source">
          bu koşumda {run.items} örnek ölçüldü · prompt {run.promptVersion} ·
          çaba {run.effort} · {run.layers}
        </p>
      )}
    </>
  );

  if (layout === "flat") return inner;
  return <div className="proof">{inner}</div>;
}
