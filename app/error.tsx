"use client";

/*
 * Hata sınırı (error boundary).
 *
 * Bir sayfa çizilirken beklenmeyen bir hata fırlarsa Next.js bunu gösterir.
 * Olmasaydı kullanıcı boş bir ekranla ya da üretimde jenerik bir çökme
 * sayfasıyla kalırdı. `reset` aynı segmenti yeniden çizmeyi dener — geçici bir
 * ağ hatasında sayfayı yenilemeye gerek kalmıyor.
 *
 * Hata metni ekrana basılmıyor: içinde tablo adı, sürücü sürümü, bazen
 * bağlantı bilgisi geçebiliyor. Tam hâli sunucu günlüğünde duruyor.
 */

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="auth">
      <div className="auth-card">
        <h1 className="auth-title">Bir şeyler ters gitti</h1>
        <p className="auth-lede">
          Bu sayfa açılırken beklenmeyen bir hata oldu. Genelde geçicidir.
        </p>

        <button className="btn btn-primary" type="button" onClick={reset}>
          Tekrar dene
        </button>

        {error.digest ? (
          <p className="auth-alt">
            Hata kodu: <code>{error.digest}</code>
          </p>
        ) : null}
      </div>
    </main>
  );
}
