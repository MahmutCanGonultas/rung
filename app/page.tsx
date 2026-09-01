import Image from "next/image";
import Link from "next/link";

import foto from "../docs/shots/rung-foto.png";

import { Mark } from "./components/Mark";
import { InView } from "./components/showcase/InView";
import { Proof } from "./components/showcase/Proof";
import { SampleAnalysis } from "./components/showcase/SampleAnalysis";
import { Stair } from "./components/showcase/Stair";
import { getSessionUser } from "./lib/session";

/*
 * Anasayfa — GELEN KİŞİYE YAZILDI, ÜRÜNÜ YAPANA DEĞİL.
 *
 * ═══ NEDEN BAŞTAN YAZILDI ═══
 *
 * Sayfa mühendise yazılmıştı. İlk gördüğün şey `%4,9`du; sonra "K0 ·
 * deterministik · model yok" rozeti, "21 yuva · 5 dolu" şeridi, "beş katmanın
 * üçü model kullanmıyor" bölümü, "sabit bir taksonomiye yazar" cümlesi.
 *
 * Ürün sahibinin teşhisi: "bir adam olaya yazılımsal olarak bakamaz. Daha çok
 * bu nedir, nasıl kullanılır. Bir de pozitif şeylerden bahsetmen lazım,
 * hatasından değil — hatası senle bana kalsın."
 *
 * İkisi de doğru ve ikincisi daha derin. Bu ürün bir HATA BULUCU gibi
 * anlatılıyordu, oysa sattığı şey hata değil: nerede olduğunu bilmek ve
 * ilerlediğini görmek. Hata, ölçümün ARACI — ürünün kendisi değil.
 *
 * ═══ YENİ SIRA ═══
 *
 *   00  BU NE       kayısı · "İngilizcen şu an nerede?" · ölçek ve davet
 *   01  NASIL       soluk  · üç adım: seç, yaz, gör
 *   02  NE GÖRECEK  kayısı · gerçek bir ölçüm, ÖNERİ olarak çerçevelenmiş
 *   03  UYDURMAZ    soluk  · doğru cümlede sessizlik — güven noktası
 *   04  DAYANAK     koyu   · ölçülen doğruluk, KÜÇÜK ve SONDA
 *
 * İKİ TON VE BİR KOYU. Leylak ve gül bantlar kalktı: onlar taksonominin
 * AİLE renkleri ve iç ekranlarda anlam taşıyorlar. Anasayfada hiçbir şeyi
 * sınıflandırmadıkları için orada yalnızca süstüler.
 *   --  KAPANIŞ     fotoğraf · asıl vaat: altı ay sonra
 *
 * ═══ TEK İSKELET: SÖYLE SOLDA, GÖSTER SAĞDA ═══
 *
 * Sayfada iki ayrı iskelet karışıyordu. 00, 04 ve kapanış iki sütunluydu;
 * 01, 02 ve 03 ise tam genişlikte bir bantta sola yaslanmış tek sütundu.
 * ÖLÇÜLDÜ: 1440px'te 02 ve 03'ün içeriği bandın sol %62'sinde bitiyor,
 * sağdaki %38 boş kalıyordu. Ürün sahibi: "sayfada bir şey çok fazla, bir
 * şeyde eksik gibi; bakarken gözüm kötü hissediyor."
 *
 * İkisi de aynı kusurdu. 02 beş bulgu satırını tam genişliğe yayıyordu
 * (düzeltme solda, aile etiketi 700 piksel ötede) — ÇOK FAZLA. 03 aynı
 * bileşenle yalnızca beş satır metin taşıyordu — EKSİK. İkisi de iki
 * sütuna geçti; artık sayfanın tamamı tek kurala uyuyor ve 01 (bir SIRA,
 * yan yana okunması gereken üç adım) tek ve bilerek konmuş istisna.
 *
 * `%4,9` artık sayfanın SONUNDA. Dün başındaydı ve o yanlıştı: kanıt, sorusu
 * olan kişiye verilir — henüz ne olduğunu bilmeyen kişiye değil. Kanıt duvarı
 * kompozisyonu doğruydu, duvara asılan SIRA yanlıştı.
 *
 * BEŞ KATMAN VE TAKSONOMİ SAYFADAN ÇIKTI. İkisi de ürünün iç yapısı ve ikisi
 * de `/accuracy` sayfasında, meraklısı için duruyor.
 *
 * ═══ DEĞİŞMEYEN ═══
 *
 * SAYFADAKİ HER ŞEY CANLI. İki örnek de gerçek K0 motorundan geçiyor,
 * doğruluk sayısı son ölçüm koşumundan okunuyor. Kendi doğruluğunu ölçtüğünü
 * iddia eden bir ürünün vitrini uydurma olamaz.
 */
export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <main className="wall" id="main">
      {/* ══ 00 · BU NE ═══════════════════════════════════════════════ */}
      <section className="belt is-warm belt-open" aria-labelledby="acilis-h">
        <div className="belt-in open-in">
          {/*
            MARKA KENDİ SATIRINDA, SAYFANIN TEPESİNDE.
            
            Önce kahraman metninin ilk çocuğuydu ve metinle birlikte dikey
            ortalanıyordu: ÖLÇÜLDÜ, 1440px'te logo sayfanın 120. pikselinde
            başlıyordu — üstünde bir avuç boşluk, ve ürün sahibinin dediği
            gibi "çok aşağıda". Bir sitenin markası başlıkla birlikte
            ortalanmaz; tepede durur.
            
            Artık bandın ilk satırı. Altındaki kahraman ızgarası kalan alanda
            ortalanıyor, yani metin ile model hâlâ birbirine göre dengeli.
          */}
          <header className="open-top">
            <Link className="mark-link" href="/">
              <Mark size="xl" />
            </Link>
          </header>

          <div className="open-hero">
            {/*
              Açılışta sıralı giriş SAF CSS: `@starting-style`. Bir sarmalayıcı
              ve `IntersectionObserver` denendi ve ÇAKMA üretti — gerekçesi
              `globals.css`te `settle` yorumunda, ölçülmüş sayılarla.
            */}
            <div className="open-say">
              <p className="open-kicker">Türkçe konuşanlar için</p>
              <h1 className="open-h" id="acilis-h">
                {/*
                "şu an" arasında KIRILMAZ BOŞLUK. `text-wrap: balance` iki
                satırı eşitlemeye çalışırken başlığı "İngilizcen şu / an
                nerede?" diye kırdı — Türkçede "şu an" tek bir zaman zarfı ve
                ortasından bölünmesi cümleyi bir an için okunmaz yapıyor.
                Dengeleme kalıyor, kırabileceği yerler kısıtlanıyor.
              */}
                İngilizcen şu&nbsp;an <b>nerede?</b>
              </h1>
              <p className="open-lede">
                Bir paragraf yaz — on beş dakika. Seviyeni ölçelim, ve altı ay
                sonra ne kadar ilerlediğini yan yana görelim.
              </p>
              <div className="open-go">
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
                      Giriş yap
                    </Link>
                  </>
                )}
              </div>
              <p className="open-note">
                {user
                  ? `Giriş yapıldı — ${user.email}`
                  : "E-posta ve şifre. Kart yok, yirmi saniye."}
              </p>
            </div>

            {/*
            Ölçek, sayfanın ilk gördüğü nesne. Beş bant ürünün tamamı: kişinin
            sorusu "ben neredeyim", cevabın şekli bu.
          */}
            <InView className="open-art">
              <Stair />
            </InView>
          </div>
        </div>
      </section>

      {/* ══ 01 · NASIL KULLANILIR ════════════════════════════════════ */}
      <section className="belt is-pale" aria-labelledby="nasil-h">
        <div className="belt-in">
          <header className="belt-head">
            <h2 className="belt-h" id="nasil-h">
              Üç adım, on beş dakika
            </h2>
            <p className="belt-sub">
              Kurs yok, ders yok, konuşacağın bir bot yok. Yazıyorsun, ve nerede
              olduğunu görüyorsun.
            </p>
          </header>

          <ol className="steps">
            {/*
              KARTLARIN GRAFİĞİ — üçü de saf CSS, tek bir dosya indirilmiyor.
              
              Her biri o adımda ekranda gerçekten olan şeyin şeması: konu
              çipleri, yazılmış bir paragraf, ve ölçek. Üçüncüsü markanın
              kendi merdiveni, düz hâliyle — yani kartlara yeni bir görsel
              dil girmiyor, var olan tekrar ediyor.
              
              `aria-hidden`: üçü de yanlarındaki başlığın resmi. Ekran
              okuyucuya aynı şeyi iki kez söylemek gürültü.
            */}
            <li className="step-card">
              <span className="step-art is-topics" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <p className="step-n">1</p>
              <h3 className="step-t">Bir konu seç</h3>
              <p className="step-w">
                Günlük hayat, iş, teknik, resmî — ya da tamamen kendi konun. Her
                konunun kendi görevleri var.
              </p>
            </li>
            <li className="step-card">
              <span className="step-art is-lines" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <p className="step-n">2</p>
              <h3 className="step-t">İngilizce yaz</h3>
              <p className="step-w">
                Sözlük kullanma, çeviri yapma. Ölçtüğümüz şey şu anki hâlin —
                yardım alarak yazılan metin seni ölçmez.
              </p>
            </li>
            <li className="step-card">
              <span className="step-art is-scale" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <p className="step-n">3</p>
              <h3 className="step-t">Ölçümünü gör</h3>
              <p className="step-w">
                Seviyen, cümlelerinin nasıl daha iyi kurulabileceği, ve zamanla
                neyin değiştiği. Hepsi tek ekranda.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* ══ 02 · NE GÖRECEKSİN ═══════════════════════════════════════ */}
      <section className="belt is-warm" aria-labelledby="gor-h">
        <div className="belt-in duo">
          <header className="belt-head">
            <h2 className="belt-h" id="gor-h">
              Her öneri, <b>nedeniyle</b> birlikte
            </h2>
            <p className="belt-sub">
              Buradaki cümle bu sayfa açılırken gerçekten ölçüldü — hazır bir
              görsel değil. İşaretlerin üstüne bak: her biri neyin nasıl
              yazılabileceğini ve <b>neden</b> öyle olduğunu söylüyor. Ezber
              değil, sebep.
            </p>
          </header>
          <InView className="belt-body">
            <SampleAnalysis variant="broken" tag={false} slots={false} />
          </InView>
        </div>
      </section>

      {/* ══ 03 · UYDURMAZ ════════════════════════════════════════════ */}
      <section className="belt is-pale" aria-labelledby="sessiz-h">
        <div className="belt-in duo">
          <header className="belt-head">
            <h2 className="belt-h" id="sessiz-h">
              Doğru yazdığında <b>susar</b>
            </h2>
            <p className="belt-sub">
              Aynı motor, doğru bir cümlede hiçbir şey bulmuyor. Bu küçük bir
              ayrıntı değil: sana olmayan bir hata göstermek, bir hatayı
              kaçırmaktan daha kötü. Doğru yazdığın yerde seni rahat bırakıyor.
            </p>
          </header>
          {/*
            `is-quiet`: sıfır bulgu sayacını vurgu renginde çizen kural buna
            bağlı. Temiz olmak da bir ÖLÇÜM sonucu, ayrı bir duygu değil.
          */}
          <InView className="belt-body is-quiet">
            <SampleAnalysis variant="clean" tag={false} slots={false} />
          </InView>
        </div>
      </section>

      {/* ══ 04 · DAYANAK — küçük, sonda, sorusu olan için ════════════ */}
      <section className="belt is-deep belt-trust" aria-labelledby="guven-h">
        <div className="belt-in trust">
          <div className="trust-say">
            <h2 className="belt-h" id="guven-h">
              Peki ya yanılırsa?
            </h2>
            <p className="belt-sub">
              Yanılıyor — ve ne sıklıkta yanıldığını ölçüp yayımlıyoruz. Bir
              ürünün &ldquo;doğru çalışıyor&rdquo; demesi kolay, kaç kere
              yanıldığını söylemesi zor. Yandaki sayı sabit yazılmadı, son ölçüm
              koşumundan okundu.
            </p>
            <p className="belt-more">
              <Link href="/accuracy">Nasıl ölçtüğümüzün tamamı →</Link>
            </p>
          </div>
          <InView className="trust-num">
            <Proof layout="flat" part="lead" />
          </InView>
        </div>
      </section>

      {/* ══ KAPANIŞ — asıl vaat ══════════════════════════════════════ */}
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
            Aynı görev, altı ay arayla. İki ölçüm yan yana durur.
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
