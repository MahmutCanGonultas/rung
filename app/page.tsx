import Image from "next/image";
import Link from "next/link";

import foto from "../docs/shots/rung-foto.png";

import { Mark } from "./components/Mark";
import { InView } from "./components/showcase/InView";
import { LAYERS, Pipeline } from "./components/showcase/Pipeline";
import { Proof } from "./components/showcase/Proof";
import { SampleAnalysis } from "./components/showcase/SampleAnalysis";
import { Stair } from "./components/showcase/Stair";
import { getSessionUser } from "./lib/session";

/*
 * Anasayfa — SAYFA VAATLE DEĞİL, ÖLÇÜMLE AÇILIYOR.
 *
 * ═══ NEDEN YENİDEN KURULDU ═══
 *
 * Önceki mimari iki sütundu: solda yapışkan ALET, sağda akan ölçümler. Fikir
 * doğruydu ve ürünü anlatıyordu ama iki ölçülmüş kusuru vardı. (1) Yapışkan
 * sütun görüntüden uzundu — 1280×720'de 66px, 1440×900'de 14px taşıyordu ve
 * yapışkan bir sütun ekrandan uzunsa alt ucuna hiçbir kaydırmayla
 * ulaşılamıyor. (2) Sağ sütun 1440px'te sayfanın yarısına sıkışıyordu, yani
 * ürünün asıl kanıtı olan ölçümler dar bir kolonda duruyordu.
 *
 * Ürün sahibi dört maket arasından "kanıt duvarı" kompozisyonunu seçti ve
 * şunu söyledi: renkler, tipografi ve üç boyutlu merdiven KALSIN, yerleşim
 * ona benzesin.
 *
 * ═══ YENİ MİMARİ: TAM GENİŞLİKTE BANTLAR ═══
 *
 *   00  KANIT    koyu   · %4,9 ve üç boyutlu ölçek — sayfanın ilk gördüğü şey
 *   01  VAAT     kayısı · "İngilizceni tahmin etme. Ölç." ve davet
 *   02  GÜRÜLTÜ  leylak · bozuk cümle, beş bulgu
 *   03  SESSİZLİK gül   · doğru cümle, sıfır bulgu
 *   04  HAT      kayısı · beş katman
 *   05  DAYANAK  koyu   · sayının nereden geldiği
 *   --  KAPANIŞ  fotoğraf
 *
 * NEDEN SAYIYLA AÇILIYOR: bu ürünün diğerlerinden ayrıldığı tek yer kendi
 * doğruluğunu ölçüp yayımlaması. Vaat ("ölç") her ürünün söyleyebileceği bir
 * cümle; %4,9 söyleyemeyeceği bir sayı. Önce söyleyemeyecekleri şey geliyor.
 *
 * SAYI İKİ KEZ ÇİZİLMİYOR. 00'da ana ölçüt tek başına ve dev; 05'te onu
 * çevreleyen sayılar (yakalama, ölçülen örnek, künye). `Proof` bileşeni
 * `part` ile ikiye ayrılıyor.
 *
 * ═══ DEĞİŞMEYEN ═══
 *
 * SAYFADAKİ HER ŞEY CANLI. İki örnek de gerçek K0 motorundan geçiyor,
 * doğruluk sayıları son ölçüm koşumundan okunuyor, katman sayısı `LAYERS`ten
 * geliyor. Kendi doğruluğunu ölçtüğünü iddia eden bir ürünün vitrini uydurma
 * olamaz.
 *
 * Ve dayanak noktası duruyor: aynı motor DOĞRU bir cümlede sıfır bulgu
 * veriyor. İki cümle ARDIŞIK — 5'i okuyup kaydırınca 0'a varıyorsun.
 */
export default async function HomePage() {
  const user = await getSessionUser();

  /* Model kullanmayan katman sayısı — render anında sayılıyor. */
  const modelsiz = LAYERS.filter((l) => !l.model).length;

  return (
    <main className="wall" id="main">
      {/* ══ 00 · KANIT — sayfa sayıyla açılıyor ══════════════════════ */}
      <section className="belt is-deep belt-proof" aria-labelledby="kanit-h">
        <div className="belt-in proof-hero">
          <div className="proof-hero-say">
            <Link className="mark-link" href="/">
              <Mark size="lg" />
            </Link>
            <h1 className="proof-hero-h" id="kanit-h">
              Kendi doğruluğunu ölçen bir alet.
            </h1>
            <InView className="proof-hero-num">
              <Proof layout="flat" part="lead" />
            </InView>
            <p className="proof-hero-sub">
              Doğru bir cümleyi &ldquo;düzeltmek&rdquo; bu aletin yapabileceği
              en kötü şey. Ne kadar sık yaptığı ölçülüyor ve burada yazıyor —
              son ölçüm koşumundan okundu, sabit yazılmadı.
            </p>
          </div>

          {/*
            Üç boyutlu merdiven — markanın motifi, sayının yanında.
            Ölçek burada bir SÜS değil: sayının neyi ölçtüğünü söylüyor.
          */}
          <InView className="proof-hero-art">
            <Stair />
          </InView>
        </div>
      </section>

      {/* ══ 01 · VAAT ════════════════════════════════════════════════ */}
      <section className="belt is-warm" aria-labelledby="vaat-h">
        <div className="belt-in vow">
          <p className="vow-kicker">Türkçe konuşanlar için</p>
          <h2 className="vow-h" id="vaat-h">
            <span>İngilizceni tahmin etme.</span>
            <b>Ölç.</b>
          </h2>
          <p className="vow-lede">
            Yazdığın İngilizceye bakıp hatayı sabit bir taksonomiye yazan,
            aylar boyunca izleyen bir alet.
          </p>
          <div className="vow-go">
            {user ? (
              <Link className="btn btn-primary btn-lg" href="/write">
                Panoya git
              </Link>
            ) : (
              <>
                <Link className="btn btn-primary btn-lg" href="/register">
                  Hesap oluştur
                </Link>
                <Link className="btn btn-lg" href="/login">
                  Giriş yap
                </Link>
              </>
            )}
          </div>
          <p className="vow-note">
            {user
              ? `Giriş yapıldı — ${user.email}`
              : "E-posta ve şifre. Yirmi saniye."}
          </p>
        </div>
      </section>

      {/* ══ 02 · GÜRÜLTÜ ═════════════════════════════════════════════ */}
      <section className="belt is-cool" aria-labelledby="act1">
        <div className="belt-in">
          <header className="belt-head">
            <p className="belt-no">01</p>
            <h2 className="belt-h" id="act1">
              Yazarsın. Alet hemen konuşmaz.
            </h2>
            <p className="belt-sub">
              Bu cümle sayfa açılırken gerçek K0 katmanından geçti — maket
              değil. Model çağrısı yok: aynı metin her zaman aynı sonucu
              veriyor.
            </p>
          </header>
          <InView className="belt-body">
            <SampleAnalysis variant="broken" />
          </InView>
        </div>
      </section>

      {/* ══ 03 · SESSİZLİK ═══════════════════════════════════════════ */}
      <section className="belt is-rose" aria-labelledby="act2">
        <div className="belt-in">
          <header className="belt-head">
            <p className="belt-no">02</p>
            <h2 className="belt-h" id="act2">
              Aynı motor, doğru cümlede susar.
            </h2>
            <p className="belt-sub">
              Ürünün kanıtlanamaz iddiası burada cümle olmaktan çıkıyor: bir
              hatayı kaçırmak telafi edilir, doğru bir cümleyi{" "}
              <b>&ldquo;düzeltmek&rdquo; edilmez</b>.
            </p>
          </header>
          {/*
            `is-quiet`: sıfır bulgu sayacını vurgu renginde çizen kural buna
            bağlı. Temiz olmak da bir ÖLÇÜM sonucu, ayrı bir duygu değil.
          */}
          <InView className="belt-body is-quiet">
            <SampleAnalysis variant="clean" tag={false} />
          </InView>
        </div>
      </section>

      {/* ══ 04 · HAT ═════════════════════════════════════════════════ */}
      <section className="belt is-warm" aria-labelledby="act3">
        <div className="belt-in">
          <header className="belt-head">
            <p className="belt-no">03</p>
            <h2 className="belt-h" id="act3">
              Beş katmanın {modelsiz}&rsquo;ü model kullanmıyor.
            </h2>
            <p className="belt-sub">
              Neyin modele verilmeyeceğini bilmek, model çağırabilmekten daha
              zor.
            </p>
          </header>
          <InView className="belt-body">
            <Pipeline />
          </InView>
        </div>
      </section>

      {/* ══ 05 · DAYANAK — sayının nereden geldiği ═══════════════════ */}
      <section className="belt is-deep" aria-labelledby="act4">
        <div className="belt-in">
          <header className="belt-head">
            <p className="belt-no">04</p>
            <h2 className="belt-h" id="act4">
              Yukarıdaki sayı nereden geliyor.
            </h2>
            <p className="belt-sub">
              %100 doğruluk mümkün değil — dil modelleri olasılıksal çalışır.
              Yapılabilecek tek şey ölçmek, ve ölçtüğünü yayımlamak. Hataları
              önceden bilinen bir küme üstünde ölçülüyor; bir kısmı bilerek
              hatasız, çünkü yanlış alarm ancak öyle sayılabiliyor.
            </p>
          </header>
          <InView className="belt-body">
            <Proof layout="flat" part="rest" />
          </InView>
          <p className="belt-more">
            <Link href="/accuracy">Ölçümün tamamı — seviye kırılımı ve koşum geçmişi →</Link>
          </p>
        </div>
      </section>

      {/* ══ KAPANIŞ — tam genişlik fotoğraf ══════════════════════════ */}
      <section className="coda" aria-labelledby="coda-h">
        <Image
          className="coda-photo"
          src={foto}
          alt=""
          sizes="100vw"
          placeholder="blur"
        />
        <div className="coda-say">
          <h2 className="coda-h" id="coda-h">
            Bugün yaz, altı ay sonra bak
          </h2>
          <Link
            className="btn btn-primary btn-lg"
            href={user ? "/write" : "/register"}
          >
            {user ? "Yazmaya başla" : "Hesap oluştur"}
          </Link>
          <p className="coda-note">Kayıtlar değiştirilemez</p>
        </div>
      </section>

      <footer className="rig-foot">
        <Mark size="sm" />
        <span>Türkçe konuşanlar için · İngilizce ölçüm aleti</span>
      </footer>
    </main>
  );
}
