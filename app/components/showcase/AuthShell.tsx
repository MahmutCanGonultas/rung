import type { ReactNode } from "react";
import Link from "next/link";

import { Mark } from "../Mark";
import { InView } from "./InView";
import { Proof } from "./Proof";
import { SampleAnalysis } from "./SampleAnalysis";

/*
 * Giriş ve kayıt ekranlarının ortak kabuğu — TEK LEVHA.
 *
 * Eskiden 5fr/7fr bir bölmeydi: solda 380px'lik bir form 600px'lik sütunun
 * ortasında asılı (ölçüldü: sütunun %76'sı boş), sağda anasayfanın
 * sıkıştırılmış bir kopyası, ve aralarında 100dvh boyunca bir çizgi. Hiçbir
 * öğe o çizgiyi geçmediği için göz yan yana iki ayrı ürün görüyordu.
 *
 * Şimdi:
 *   · analiz sayfanın ZEMİNİ, kenardan kenara
 *   · form o zeminin üstünde duran ve üst kenarını KIRAN yükseltilmiş nesne
 *   · beş gerçek bulgu kartın altından tam genişlikte geçiyor
 *   · ölçülen doğruluk en altta, aletin durum çubuğu gibi
 *
 * Kompozisyon üstte ayrık, altta sürekli — dikiş artık çizilemiyor.
 *
 * Sarmalayıcı levhanın kendisi: tek gözlemci, tek saat, tek yüzey.
 *
 * Dar ekranda hiçbir şey GİZLENMİYOR. Eski gerekçe ("giriş yapmak ikna
 * olmaktan önce gelir") SIRA hakkındaydı ve doğruydu; ama kanıt o zaman
 * genişlik için yarışıyordu. Tek sütunda yarışmıyor: kart hâlâ ilk, hâlâ
 * katlamanın üstünde, e-posta hâlâ odakta.
 */
export function AuthShell({
  mode,
  title,
  titleSoft,
  lede,
  children,
}: {
  mode: "login" | "register";
  title: string;
  titleSoft: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <main id="main">
      <InView className="auth-stage">
        <header className="auth-head">
          <Link className="mark-link" href="/" aria-label="Rung ana sayfası">
            <Mark />
          </Link>
          <p className="auth-note">
            Yazdığın İngilizceyi ölçen alet. Aşağıdaki cümle bu sayfa açılırken
            gerçek K0 katmanından geçti — maket değil.
          </p>
        </header>

        <i className="auth-plate" aria-hidden="true" />

        {/* İlk sırada: DOM'da, sekmede, gözde. */}
        <div className="auth-card">
          <h1 className="auth-title">
            {title}
            <span className="auth-title-soft">{titleSoft}</span>
          </h1>
          <p className="auth-lede">{lede}</p>
          {children}

          {/*
            İki kapı, formdan SONRA: bu ekrana gelen kişi kapıyı zaten seçmiş
            geliyor, burası yanlış seçtiğini fark ettiği yer. Sekme sırası
            e-posta → şifre → gönder → kapılar, yani form ilk.
          */}
          <nav className="auth-switch" aria-label="Giriş veya kayıt">
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
        </div>

        <SampleAnalysis />
        <Proof compact />
      </InView>
    </main>
  );
}
