import Link from "next/link";

import { Mark } from "./components/Mark";
import { InView } from "./components/showcase/InView";
import { Pipeline } from "./components/showcase/Pipeline";
import { Proof } from "./components/showcase/Proof";
import { SampleAnalysis } from "./components/showcase/SampleAnalysis";
import { FalseAlarm } from "./components/showcase/FalseAlarm";
import { Stair } from "./components/showcase/Stair";
import { getSessionUser } from "./lib/session";

/*
 * Anasayfa — ürünün ön kapısı, ve bir ARGÜMAN.
 *
 * Altı hamle, altısı da yapı olarak farklı: ray satırı, iddia, deneme,
 * mekanizma, ölçüm, kapanış. Eskiden altı bölümün altısı da aynı 980px'lik
 * sütunda, aynı zeminde, aynı ritimde duruyordu — o yüzden sayfa bir
 * kompozisyon değil, bir listeydi.
 *
 * Oturuma bakıyor, yani her istekte çerez okunuyor; Next.js bu sayfayı
 * kendiliğinden dinamik sayıyor.
 *
 * SAYFADAKİ HER ŞEY CANLI. İki örnek de gerçek K0 motorundan geçiyor,
 * doğruluk sayıları son ölçüm koşumundan okunuyor. Kendi doğruluğunu
 * ölçtüğünü iddia eden bir ürünün vitrini uydurma olamaz.
 *
 * Sayfanın dayanak noktası ikinci cümle: aynı motor, DOĞRU bir cümlede sıfır
 * bulgu veriyor. Ürünün kanıtlanamaz iddiası ("doğru cümleyi düzeltmiyoruz")
 * böylece cümle olmaktan çıkıp sayfanın hesapladığı bir olaya dönüşüyor —
 * ve `app/lib/k0/showcase.test.ts` o sıfırı kilitliyor.
 */
export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <main className="land" id="main">
      <header className="move land-bar">
        <Mark />
        <nav className="land-nav">
          {user ? (
            <Link className="btn btn-primary" href="/dashboard">
              Panoya git
            </Link>
          ) : (
            <>
              <Link className="btn btn-quiet" href="/login">
                Giriş yap
              </Link>
              <Link className="btn btn-primary" href="/register">
                Hesap oluştur
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="move claim">
        <p className="claim-kicker">Türkçe konuşanlar için</p>

        {/*
          Sessiz öncül, yüksek sesli fiil.

          Eskiden "İngilizceni tahmin etme."nin üstü çiziliyor ve altına hata
          rengiyle dalgalı çizgi geliyordu — ürünün kendi hata dilbilgisi kendi
          başlığına uygulanıyordu. Kaldırıldı: sayfaya ilk bakan kişi o kırmızı
          çizgileri ürünün kendi hatası sanabiliyordu, ve dalga "Ölç."ün
          noktalarına giriyordu.

          Farkı artık boyut ve ağırlık taşıyor. `.hero-was` bir öncül, `<h1>`
          gövdesi ise tek kelime: Ölç.
        */}
        <h1 className="hero-title">
          <span className="hero-was">İngilizceni tahmin etme.</span>
          Ölç.
        </h1>

        <p className="claim-intro">
          Kurs değil, sohbet botu değil, yazım denetleyicisi değil. Yazdığın
          İngilizceye bakıp hatayı sabit bir taksonomiye yazan, aylar boyunca
          izleyen ve <b>kendi doğruluğunu ölçen</b> bir alet.
        </p>

        <div className="claim-actions">
          {user ? (
            <Link className="btn btn-primary btn-lg" href="/write">
              Yazmaya başla
            </Link>
          ) : (
            <>
              <Link className="btn btn-primary btn-lg" href="/register">
                Hesap oluştur
              </Link>
              <Link className="btn btn-lg" href="/login">
                Zaten hesabım var
              </Link>
            </>
          )}
        </div>

        <p className="claim-note">
          {user
            ? `Giriş yapıldı — ${user.email}`
            : "E-posta ve şifre. Yirmi saniye."}
        </p>

        {/*
          Sağ sütun: önce ÖLÇÜM, sonra o ölçümün neden bu ölçüt olduğunu
          söyleyen cümle. Sıra bilerek böyle — insan önce kırk bir çentiği ve
          içindeki iki kırmızıyı görüyor, sonra "neden yanlış alarm?" sorusunun
          cevabını okuyor. Ters sırada iddia, kanıtı olmayan bir cümle olurdu.

          Burası eskiden BOŞTU: tez dibe yaslıydı ve üstünde ~700×360'lık
          tasarlanmamış bir boşluk duruyordu.
        */}
        <aside className="claim-plate">
          {/*
            Kahramanda bugüne kadar HİÇ hareket yoktu. Basamaklar ekrana girer
            girmez sırayla yükseliyor ve bu doğru: sayfanın ilk görülen yeri
            burası. Hareket A1'den C1'e tırmanıyor — ürünün ne yaptığının
            kendisi.
          */}
          <InView className="model-hold">
            <Stair />
          </InView>
          <div className="claim-thesis">
            <p>
              Bir hatayı kaçırmak telafi edilir. Doğru bir cümleyi{" "}
              <strong>&ldquo;düzeltmek&rdquo; edilmez</strong> — o an alete olan
              güven biter.
            </p>
            <p className="claim-metric">
              Ana ölçüt: <b>false alarm (yanlış alarm)</b> oranı
              <FalseAlarm />
            </p>
          </div>
        </aside>
      </section>

      <section className="move trial" aria-labelledby="trial-h">
        <h2 className="move-h" id="trial-h">
          Aynı motor, iki cümle
        </h2>
        <p className="move-sub">
          İkisi de bu sayfa açılırken gerçek K0 katmanından geçti — maket
          değil. Model çağrısı yok: aynı metin her zaman aynı sonucu veriyor.
        </p>

        {/*
          İki ayrı gözlemci: masaüstünde yan yana oldukları için birlikte,
          telefonda alt alta oldukları için ayrı ayrı ateşleniyorlar.
        */}
        <InView className="trial-pane is-broken">
          <SampleAnalysis variant="broken" />
        </InView>
        <InView className="trial-pane is-clean">
          <SampleAnalysis variant="clean" />
        </InView>
      </section>

      <section className="move mech" aria-labelledby="mech-h">
        <h2 className="move-h" id="mech-h">
          Sessiz kalabilmesinin sebebi
        </h2>
        <p className="move-sub">
          Beş katmanın üçü model kullanmıyor. Neyin modele verilmeyeceğini
          bilmek, model çağırabilmekten daha zor.
        </p>
        <InView className="mech-rail">
          <Pipeline />
        </InView>
      </section>

      {/*
        `Proof` düz döndüğü için ölçüm şeridinin KENDİSİ gözlemci olmak
        zorunda: dört parça ızgaranın doğrudan çocuğu oluyor. Yer imi için
        dıştan sarılıyor.
      */}
      <section aria-labelledby="measure-h">
        <InView className="move measure">
          <h2 className="move-h" id="measure-h">
            Ve kendi doğruluğunu ölçüyor
          </h2>
          <p className="move-sub">
            %100 doğruluk mümkün değil — dil modelleri olasılıksal çalışır.
            Bunu garanti eden herkes yanılıyor. Yapılabilecek tek şey ölçmek.
          </p>
          <Proof layout="flat" />
        </InView>
      </section>

      <section className="move close" aria-labelledby="close-h">
        <h2 className="move-h" id="close-h">
          Bugün yaz, altı ay sonra bak
        </h2>
        <div className="claim-actions">
          <Link
            className="btn btn-primary btn-lg"
            href={user ? "/write" : "/register"}
          >
            {user ? "Yazmaya başla" : "Hesap oluştur"}
          </Link>
        </div>
        <p className="close-note">Kayıtlar değiştirilemez</p>
      </section>

      <footer className="move land-foot">
        <span>
          rung<i>.</i>
        </span>
        <span>İngilizce ölçüm aleti</span>
      </footer>
    </main>
  );
}
