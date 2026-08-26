import Image from "next/image";
import Link from "next/link";

import foto from "../docs/shots/rung-foto.png";

import { Mark } from "./components/Mark";
import { InView } from "./components/showcase/InView";
import { FalseAlarm } from "./components/showcase/FalseAlarm";
import { LAYERS, Pipeline } from "./components/showcase/Pipeline";
import { Proof } from "./components/showcase/Proof";
import { SampleAnalysis } from "./components/showcase/SampleAnalysis";
import { Stair } from "./components/showcase/Stair";
import { getSessionUser } from "./lib/session";

/*
 * Anasayfa — ALET DURUR, ÖLÇÜMLER GEÇER.
 *
 * ═══ NEDEN BAŞTAN YAZILDI ═══
 *
 * Bu sayfa yedi tur boyunca yedi kez yeniden RENKLENDİ ama bir kez bile
 * yeniden KURULMADI. Yapı hep aynıydı: üst üste yığılmış altı-yedi tam
 * genişlikte bant, hep aynı sırada, her birinin içinde başlık + alt cümle +
 * bir nesne. Zeminleri değiştirmek, boşlukları ölçmek, jetonları düzeltmek —
 * hepsi o yığının üstüne sürülen boyaydı. Ürün sahibinin sözü: "bir inşaatı
 * yıkıp sıfırdan yapın deseler sadece boyasını mı değiştirirler?"
 *
 * ═══ YENİ MİMARİ ═══
 *
 * Sayfa artık iki şeyden oluşuyor:
 *
 *   SOL — ALET. Ekran boyunda, `position: sticky` ile kaydırma boyunca yerinde
 *   duruyor: marka, iddia, üç boyutlu ölçek, ölçülen ana sayı ve davet. Hiç
 *   kaybolmuyor.
 *
 *   SAĞ — GEÇEN ÖLÇÜMLER. Dört numaralı bölüm tek sütunda akıyor: bozuk cümle,
 *   temiz cümle, beş katman, ölçülen doğruluk.
 *
 * Bu bir düzen tercihi değil, ÜRÜNÜN KENDİSİ: alet elinde kalır, ölçtüğü
 * şeyler gelip geçer. Aylar boyunca aynı ölçek, değişen metinler.
 *
 * Yan kazanç ölçülebilir: davet düğmesi kaydırmanın her noktasında ekranda.
 * Eski yapıda ilk 660 pikselden sonra kayboluyordu.
 *
 * ═══ DEĞİŞMEYEN ═══
 *
 * SAYFADAKİ HER ŞEY CANLI. İki örnek de gerçek K0 motorundan geçiyor,
 * doğruluk sayıları son ölçüm koşumundan okunuyor, katman sayısı `LAYERS`ten
 * geliyor. Kendi doğruluğunu ölçtüğünü iddia eden bir ürünün vitrini uydurma
 * olamaz.
 *
 * Ve dayanak noktası duruyor: aynı motor DOĞRU bir cümlede sıfır bulgu
 * veriyor. Eskiden bu iki cümle yan yanaydı; artık ARDIŞIK — 5'i okuyup
 * kaydırınca 0'a varıyorsun. Karşılaştırma mekândan zamana geçti ve
 * `showcase.test.ts` iki sayıyı da kilitlemeye devam ediyor.
 */
export default async function HomePage() {
  const user = await getSessionUser();

  /* Model kullanmayan katman sayısı — render anında sayılıyor. */
  const modelsiz = LAYERS.filter((l) => !l.model).length;

  return (
    <main className="rig" id="main">
      {/*
        İKİ SÜTUN KENDİ KABINDA. `.rig`in doğrudan çocukları olsalardı yapışkan
        panelin sınırı ızgara kabının kendisi olurdu ve panel ALTBİLGİNİN
        ÜSTÜNE kadar inerdi — ÖLÇÜLDÜ: sayfanın sonunda sol yarı hâlâ koyuydu.
        Kendi kabı sağ sütunla birlikte bittiği için panel de orada bırakıyor.
      */}
      <div className="rig-body">
        {/* ══ SOL: ALET ══ */}
        <aside className="tool">
          <div className="tool-in">
            <Link className="mark-link" href="/">
              <Mark size="lg" />
            </Link>

            <p className="tool-kicker">Türkçe konuşanlar için</p>
            <h1 className="tool-title">
              <span>İngilizceni tahmin etme.</span>
              <b>Ölç.</b>
            </h1>

            <InView className="tool-art">
              <Stair />
            </InView>

            <p className="tool-lede">
              Yazdığın İngilizceye bakıp hatayı sabit bir taksonomiye yazan,
              aylar boyunca izleyen ve <b>kendi doğruluğunu ölçen</b> bir alet.
            </p>

            <div className="tool-go">
              {user ? (
                <Link className="btn btn-primary btn-lg" href="/dashboard">
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
            <p className="tool-note">
              {user
                ? `Giriş yapıldı — ${user.email}`
                : "E-posta ve şifre. Yirmi saniye."}
            </p>
          </div>
        </aside>

        {/* ══ SAĞ: GEÇEN ÖLÇÜMLER ══ */}
        <div className="reel">
          {/*
            Bölüm başlıkları NUMARALI ve numara ölçülen sayının kendisi değil
            SIRA — ölçülen sayılar bölümlerin içinde, kendi yerlerinde duruyor.
          */}
          <section className="scene" aria-labelledby="act1">
            <p className="scene-no">01</p>
            <h2 className="scene-h" id="act1">
              Yazarsın. Alet hemen konuşmaz.
            </h2>
            <p className="scene-sub">
              Bu cümle sayfa açılırken gerçek K0 katmanından geçti — maket
              değil. Model çağrısı yok: aynı metin her zaman aynı sonucu
              veriyor.
            </p>
            <InView className="scene-body is-noisy">
              <SampleAnalysis variant="broken" />
            </InView>
          </section>

          <section className="scene" aria-labelledby="act2">
            <p className="scene-no">02</p>
            <h2 className="scene-h" id="act2">
              Aynı motor, doğru cümlede susar.
            </h2>
            <p className="scene-sub">
              Ürünün kanıtlanamaz iddiası burada cümle olmaktan çıkıyor: bir
              hatayı kaçırmak telafi edilir, doğru bir cümleyi{" "}
              <b>&ldquo;düzeltmek&rdquo; edilmez</b>.
            </p>
            <InView className="scene-body is-quiet">
              <SampleAnalysis variant="clean" tag={false} />
            </InView>
          </section>

          <section className="scene" aria-labelledby="act3">
            <p className="scene-no">03</p>
            <h2 className="scene-h" id="act3">
              Beş katmanın {modelsiz}&rsquo;ü model kullanmıyor.
            </h2>
            <p className="scene-sub">
              Neyin modele verilmeyeceğini bilmek, model çağırabilmekten daha
              zor.
            </p>
            <InView className="scene-body is-rail">
              <Pipeline />
            </InView>
          </section>

          <section className="scene" aria-labelledby="act4">
            <p className="scene-no">04</p>
            <h2 className="scene-h" id="act4">
              Ve kendi doğruluğunu ölçüp yayımlıyor.
            </h2>
            <p className="scene-sub">
              %100 doğruluk mümkün değil — dil modelleri olasılıksal çalışır.
              Yapılabilecek tek şey ölçmek. Aşağıdaki sayılar sabit yazılmadı;
              son ölçüm koşumundan okundu.
            </p>
            <InView className="scene-body is-proof">
              <Proof layout="flat" />
            </InView>
          </section>
        </div>
      </div>

      {/* ══ KAPANIŞ — tam genişlik, iki sütunun altından geçiyor ══ */}
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
          <p className="coda-note">
            Kayıtlar değiştirilemez · ana ölçüt yanlış alarm <FalseAlarm />
          </p>
        </div>
      </section>

      <footer className="rig-foot">
        <Mark size="sm" />
        <span>Türkçe konuşanlar için · İngilizce ölçüm aleti</span>
      </footer>
    </main>
  );
}
