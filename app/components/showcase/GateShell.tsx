import type { ReactNode } from "react";
import Link from "next/link";

import { BAND_ORDER } from "../../lib/k0/bands";
import { estimateLevel } from "../../lib/k3/estimate";
import { showcaseAnalysis } from "../../lib/showcase-run";
import { Mark } from "../Mark";
import { Stair } from "./Stair";
import { TaxonomyChips, RecordStamp, LevelSignals } from "./Figures";
import { InView } from "./InView";
import { Pipeline } from "./Pipeline";
import { Proof } from "./Proof";
import { SampleAnalysis } from "./SampleAnalysis";

/*
 * KAPI — giriş ve kayıt ekranı.
 *
 * Bu üçüncü tasarım. Önceki ikisi de reddedildi ve ikisinin de kusuru aynıydı:
 * sert, soğuk, geniş boş alanlı bir alet panosu. Buradaki karar sıcaklık —
 * kâğıt zemin, tuvalin dışından tek bir ışık, okunacak yerlerde kitap yüzü.
 *
 * Ekran aynı zamanda ÜRÜNÜ ANLATIYOR. Beş adım, ve her adımın yanında iddiayı
 * kanıtlayan canlı bir şey: K0'ın bu sayfada bulduğu beş hata, taksonominin
 * kendisi, beş katman, kaydın alanları, dört sinyal. Hiçbiri cümle değil.
 *
 * Katlamanın üstünde tek iş var: form. Kadran ve cümle onun yanında duruyor;
 * ders formdan SONRA başlıyor. Otuzuncu ziyaretinde gelen kişi aşağı hiç
 * bakmıyor.
 */
export function GateShell({
  mode,
  kicker,
  title,
  lede,
  footnote,
  children,
}: {
  mode: "login" | "register";
  kicker: string;
  title: string;
  lede: string;
  footnote?: string;
  children: ReactNode;
}) {
  /*
   * Merdivende yanan basamak: aşağıdaki örnek cümlenin ÖLÇÜLEN bandı. Aynı
   * motor, aynı çalıştırma — cümle şeridiyle birebir aynı ölçüm.
   */
  const run = showcaseAnalysis("broken");
  const level = estimateLevel(
    run.text,
    run.findings.map((f) => f.subcategory)
  );
  const litIndex = Math.max(
    0,
    BAND_ORDER.indexOf(level.level as (typeof BAND_ORDER)[number])
  );

  return (
    <main className="gate" id="main">
      <header className="gate-bar">
        <Link className="mark-link" href="/" aria-label="Rung ana sayfası">
          <Mark size="lg" />
        </Link>
        <p className="gate-tag">
          Türkçe konuşanlar için · İngilizce ölçüm aleti
        </p>
      </header>

      {/* ── katlamanın üstü: kapı, kadran, ölçülen cümle ─────────────── */}
      <InView className="gate-hero">
        <div className="gate-enter">
          <p className="gate-kicker">{kicker}</p>
          <h1 className="gate-title">
            {title}
            <i>.</i>
          </h1>
          <p className="gate-lede">{lede}</p>

          {children}

          {/*
            İki kapı formdan SONRA: buraya gelen kişi kapıyı zaten seçmiş
            geliyor, burası yanlış seçtiğini fark ettiği yer. Sekme sırası
            e-posta → şifre → gönder → kapılar.
          */}
          <nav className="gate-doors" aria-label="Giriş veya kayıt">
            <Link
              href="/login"
              aria-current={mode === "login" ? "page" : undefined}
            >
              Giriş yap
            </Link>
            <Link
              href="/register"
              aria-current={mode === "register" ? "page" : undefined}
            >
              Hesap oluştur
            </Link>
          </nav>

          {footnote ? <p className="gate-foot">{footnote}</p> : null}
        </div>

        <div className="gate-instrument">
          {/*
            Aletin ölçeği, üç boyutta. Anasayfadaki merdivenin AYNISI — ama
            orada ışık tırmanıyor (vaat), burada ölçülen basamakta duruyor
            (okuma). Tek nesne, iki davranış.

            Burada eskiden düz çizgili bir kadran vardı; taksonomiyi çevre
            ekseninde gösteriyordu ve o iş zaten 02. adımda yirmi bir jetonla
            yapılıyor. Aynı şeyi iki kez söylemek yerine ürünün kendi nesnesi
            büyütüldü.
          */}
          <Stair lit={litIndex} />
          <p className="gate-caption">
            Aletin ölçeği: beş bant, A1&rsquo;den C1&rsquo;e. Yanan basamak, bu
            sayfa açılırken gerçek K0 katmanının aşağıdaki cümleyi ölçtüğü yer.
            Her bant aynı ölçekte kalıyor, o yüzden altı ay sonraki ölçüm
            bugünküyle karşılaştırılabiliyor.
          </p>
        </div>

        {/* Şerit İKİ SÜTUNU DA kesiyor: kompozisyonda dikiş kalmıyor. */}
        <div className="gate-read">
          <SampleAnalysis part="read" />
          <p className="gate-caption">
            Bu cümle sayfa açılırken gerçek K0 katmanından geçti — maket değil.
            Model çağrısı yok: aynı metin her zaman aynı beş bulguyu veriyor,
            ve her bulgu metinde bir yere çapalı. Motor havada hata
            söyleyemiyor.
          </p>
        </div>
      </InView>

      <p className="gate-scroll">
        <a href="#nasil">Alet nasıl çalışıyor ↓</a>
      </p>

      {/* ── ders: beş adım ──────────────────────────────────────────── */}
      <section className="gate-chapter" id="nasil" aria-labelledby="nasil-h">
        <header className="chapter-head">
          <p className="gate-kicker">Nasıl çalışıyor</p>
          <h2 className="chapter-title" id="nasil-h">
            Beş adımda, baştan sona.
          </h2>
          <p className="chapter-sub">
            Aşağıdaki her şey bu sayfa açılırken hesaplandı ya da veritabanından
            okundu. Ekranda maket bir sayı yok.
          </p>
        </header>

        <Step
          n="01"
          title="Yazarsın. Alet hemen konuşmaz."
          note="Beşin ikisi Türkçe konuşanlara özel bir aileden geldi. Genel bir dil aracı “the meeting of tomorrow” ifadesini biraz resmî diye geçiyor; burada kendi adı var."
          caption="K0 motorunun bu sayfa çizilirken ürettiği beş bulgu."
          figure={
            <InView>
              <SampleAnalysis part="shelf" open="all" />
            </InView>
          }
        >
          Bir görev seçip İngilizce yazıyorsun. Metnine dokunan ilk katman K0:
          yazım, dil bilgisi kalıpları, kelime bandı ve cümle karmaşıklığı.
          Hepsi <b>deterministic (belirlenimci)</b> — model çağrısı yok, aynı
          metin her zaman aynı sonucu veriyor. Yukarıdaki cümlenin beş bulgusu
          aşağıda, motorun kendi açıklamalarıyla duruyor.
        </Step>

        <Step
          n="02"
          title="Her bulgu sabit bir yere yazılır."
          note="Beşinci aile ürünün ayırt edici tarafı: artikel düşürme, birebir çeviri, sözcük sırası, kalıp. Türkçede artikel yok, cinsiyetli zamir yok, sözcük sırası farklı — bu yüzden hatalar öngörülebilir ve karakteristik."
          caption="Listeyi tek bir kaynak belirliyor; oraya bir alt kategori eklendiğinde kadrana bir ışın ekleniyor."
          figure={<TaxonomyChips />}
        >
          Bulunan her şey, önceden kilitlenmiş bir{" "}
          <b>taxonomy (taksonomi)</b> içindeki tek bir alt kategoriye
          yazılıyor: beş aile, yirmi bir alt kategori. Sebep basit — model
          bugün &ldquo;yanlış edat&rdquo;, yarın &ldquo;preposition
          error&rdquo; derse hiçbir şey takip edilemez. Yeni alt kategori
          eklenebilir; var olanın adı değişemez. Yukarıdaki kadranın
          çevresindeki yirmi bir ışın tam olarak bunlar.
        </Step>

        <Step
          n="03"
          title="Beş katman. Üçünde model çalışmıyor."
          note="K2, K1’in gerekçesini bilerek görmüyor. İkinci geçişe bulgunun açıklaması verilmiyor — verilseydi model kendi cümlesini onaylardı."
          caption="Mor işaretli iki satır modele giden katmanlar."
          figure={
            <InView className="step-rail">
              <Pipeline />
            </InView>
          }
        >
          Metin beş katmandan sırayla geçiyor ve yalnızca yorum gerektiren kısım
          modele gidiyor. Neyin modele verilmeyeceğini bilmek, model
          çağırabilmekten daha zor. Modele giden kısım da serbest konuşmuyor:
          sabit taksonomiye ve zorunlu bir şemaya yazmak zorunda.
        </Step>

        <Step
          n="04"
          title="Kayıt, yazıldığı gün neyse o kalıyor."
          note="Geçmişi düzeltebilen bir alet, geçmişi ölçemez. Altı ay sonra “o zaman ne ölçmüştük” sorusunun tek bir cevabı olmasının sebebi bu."
          figure={<RecordStamp />}
        >
          Her analiz; metni, bulguları, onu üreten model kimliğini ve{" "}
          <b>prompt version (istem sürümü)</b> bilgisini birlikte saklıyor.
          Kayıtların değişmezliği koda değil <b>veritabanına</b> yazılı:
          yazılmış bir metni güncelleme denemesi veritabanı seviyesinde geri
          çevriliyor. Aynı metni yeniden analiz edersen yeni bir kayıt
          açılıyor, eskisi olduğu yerde kalıyor.
        </Step>

        <Step
          n="05"
          title="Aylar boyunca aynı ölçek."
          note="Hatasız olmak tek başına yüksek seviye vermiyor; A1 de kısa ve doğru cümle kurabilir. “Hata türü” sinyalinin en yüksek ağırlığı taşımasının sebebi bu."
          figure={<LevelSignals />}
        >
          Her kaydın seviyesi dört deterministik sinyalden hesaplanıyor: kelime
          bandı, cümle karmaşıklığı, hata yoğunluğu ve hata türü. Hiçbiri
          modele sorulmuyor; hepsi aynı metinde her zaman aynı sonucu veriyor.
          Altı ay sonraki ölçüm bugünküyle aynı ölçeği kullanıyor —
          karşılaştırmanın anlamı buradan geliyor. Aşağıdakiler yukarıdaki
          cümlenin gerçek sinyalleri.
        </Step>
      </section>

      {/* ── ölçülen doğruluk ────────────────────────────────────────── */}
      <section className="gate-accuracy" aria-labelledby="dogruluk-h">
        <div className="accuracy-head">
          <h2 className="chapter-title" id="dogruluk-h">
            Ve kendi doğruluğunu ölçüp yayımlıyor.
          </h2>
          <p className="chapter-sub">
            %100 doğruluk mümkün değil — dil modelleri olasılıksal çalışıyor.
            Yapılabilecek tek şey ölçmek, ve ölçtüğünü yayımlamak. Aşağıdaki
            sayılar sabit yazılmadı; son ölçüm koşumundan,{" "}
            <b>gold set (altın küme)</b> üstünden okundu.
          </p>
          <p className="accuracy-thesis">
            Ana ölçüt <b>false alarm (yanlış alarm)</b>: doğru olan bir cümleyi
            &ldquo;düzeltmek&rdquo;. Bir hatayı kaçırmak telafi edilir, bu
            edilmez.
          </p>
        </div>
        <InView className="accuracy-band">
          <Proof layout="flat" />
        </InView>
      </section>

      <section className="gate-close">
        <h2 className="chapter-title">
          Bugün yaz. Altı ay sonra aynı ölçekte bak.
        </h2>
        <p className="gate-scroll">
          <a href="#main">Yukarıdaki forma dön ↑</a>
        </p>
      </section>

      <footer className="gate-end">
        <Mark size="sm" />
        <span>Kayıtlar değiştirilemez</span>
        <span>İngilizce ölçüm aleti</span>
      </footer>
    </main>
  );
}

/*
 * Tek adım: asılı folyo numarası, serif başlık, gövde, dış kenarda omuz notu,
 * ve altında iddiayı kanıtlayan şekil.
 */
function Step({
  n,
  title,
  note,
  caption,
  figure,
  children,
}: {
  n: string;
  title: string;
  note: string;
  caption?: string;
  figure: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="step">
      <p className="step-folio" aria-hidden="true">
        {n}
      </p>
      <div className="step-body">
        <h3 className="step-title">{title}</h3>
        <p className="step-text">{children}</p>
      </div>
      <aside className="step-note">{note}</aside>
      <div className="step-figure">
        {figure}
        {caption ? <p className="gate-caption">{caption}</p> : null}
      </div>
    </article>
  );
}
