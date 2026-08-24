import Link from "next/link";

import { Mark } from "./components/Mark";
import { InView } from "./components/showcase/InView";
import { Pipeline } from "./components/showcase/Pipeline";
import { Proof } from "./components/showcase/Proof";
import { SampleAnalysis } from "./components/showcase/SampleAnalysis";
import { getSessionUser } from "./lib/session";

/*
 * Anasayfa — ürünün ön kapısı.
 *
 * Oturuma bakıyor, yani her istekte çerez okunuyor; Next.js bu sayfayı
 * kendiliğinden dinamik sayıyor.
 *
 * Sayfadaki iki şey CANLI, maket değil: örnek analiz gerçek K0 motorundan
 * geçiyor, doğruluk sayıları son ölçüm koşumundan okunuyor. Kendi
 * doğruluğunu ölçtüğünü iddia eden bir ürünün vitrini uydurma olamaz.
 */
export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <main className="land" id="main">
      <header className="land-bar">
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

      <section className="hero">
        <p className="hero-kicker">Türkçe konuşanlar için</p>
        {/*
          Başlık ürünün kendi dilbilgisini kendine uyguluyor: önce "tahmin
          etme" cümlesi hata rengiyle dalgalı çiziliyor, sonra üstü çiziliyor,
          sonra "Ölç." vurgu rengine dönüyor — düzeltme kabul edildi. Her bulgu
          kartında olan şeyin aynısı, sayfanın ilk saniyesinde.

          Hiçbir şey gizlenmiyor: başlık ilk kareden itibaren tam okunur,
          yalnızca rengi ve çizgisi değişiyor. LCP cezası ve düzen kayması yok.
        */}
        <h1 className="hero-title">
          <span className="hero-was">İngilizceni tahmin etme.</span>
          <br />
          <span className="hero-em">Ölç.</span>
        </h1>
        <p className="hero-lede">
          Kurs değil, sohbet botu değil, yazım denetleyicisi değil. Yazdığın
          İngilizceye bakıp hatayı sabit bir taksonomiye yazan, aylar boyunca
          izleyen ve <b>kendi doğruluğunu ölçen</b> bir alet.
        </p>

        <div className="hero-actions">
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

        <p className="hero-note">
          {user
            ? `Giriş yapıldı — ${user.email}`
            : "E-posta ve şifre. Yirmi saniye."}
        </p>
      </section>

      <section className="land-section">
        <h2 className="land-h">Bir metin böyle okunuyor</h2>
        <p className="land-sub">
          Aşağıdaki bulgular maket değil — bu metin sayfa açılırken gerçek
          deterministik katmandan geçti. Model çağrısı yok: aynı metin her
          zaman aynı sonucu veriyor.
        </p>
        <InView>
          <SampleAnalysis />
        </InView>
      </section>

      <section className="land-section">
        <h2 className="land-h">Beş katman — üçünde yapay zekâ yok</h2>
        <p className="land-sub">
          Modele ne kadar az iş verirsen o kadar az saçmalıyor. Neyin modele
          verilmeyeceğini bilmek, model çağırabilmekten daha zor.
        </p>
        <InView>
          <Pipeline />
        </InView>
      </section>

      <section className="land-section">
        <h2 className="land-h">Ve kendi doğruluğunu ölçüyor</h2>
        <p className="land-sub">
          %100 doğruluk mümkün değil — dil modelleri olasılıksal çalışır. Bunu
          garanti eden herkes yanılıyor. Yapılabilecek şey ölçmek.
        </p>
        <InView>
          <Proof />
        </InView>
      </section>

      <section className="land-cta">
        <h2 className="land-h">Bugün yaz, altı ay sonra bak</h2>
        <p className="land-sub">
          Kayıtlar değiştirilemez. Altı ay sonraki karşılaştırmanın doğru
          olmasının tek yolu bu.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary btn-lg" href={user ? "/write" : "/register"}>
            {user ? "Yazmaya başla" : "Hesap oluştur"}
          </Link>
        </div>
      </section>

      <footer className="land-foot">
        <span>
          rung<i>.</i>
        </span>
        <span>İngilizce ölçüm aleti</span>
      </footer>
    </main>
  );
}
