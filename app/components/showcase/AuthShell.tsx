import type { ReactNode } from "react";
import Link from "next/link";

import { Proof } from "./Proof";
import { SampleAnalysis } from "./SampleAnalysis";

/*
 * Giriş ve kayıt ekranlarının ortak kabuğu.
 *
 * İki sütun: solda form, sağda ürünün ne yaptığının kanıtı. Boş bir giriş
 * kutusu, ilk kez gelen birine hiçbir şey anlatmıyor — sağdaki sütun o boşluğu
 * dolduruyor ve içindeki her şey gerçek: analiz canlı motordan, sayılar son
 * ölçüm koşumundan.
 *
 * Dar ekranda sağ sütun forma yer açmak için gizleniyor; giriş yapmak
 * ikna olmaktan önce gelir.
 */
export function AuthShell({
  title,
  lede,
  children,
  alt,
}: {
  title: string;
  lede: string;
  children: ReactNode;
  alt: ReactNode;
}) {
  return (
    <main className="auth-split" id="main">
      <div className="auth-pane">
        <Link className="mark auth-mark" href="/">
          rung<i>.</i>
        </Link>

        <div className="auth-box">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-lede">{lede}</p>
          {children}
          <p className="auth-alt">{alt}</p>
        </div>

        <p className="auth-foot">Türkçe konuşanlar için İngilizce ölçüm aleti</p>
      </div>

      <aside className="auth-aside" aria-label="Ürün hakkında">
        <div className="auth-aside-inner">
          <p className="auth-aside-kicker">Ne yapıyor</p>
          <p className="auth-aside-lede">
            Yazdığın İngilizceye bakıp hatayı sabit bir taksonomiye yazıyor,
            aylar boyunca izliyor ve <b>kendi doğruluğunu ölçüyor</b>.
          </p>

          <SampleAnalysis compact />
          <Proof compact />
        </div>
      </aside>
    </main>
  );
}
