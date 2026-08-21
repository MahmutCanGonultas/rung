"use client";

/*
 * Kök layout'un kendisi patlarsa `app/error.tsx` de çizilemez — çünkü o da
 * kök layout'un içinde yaşıyor. Bu dosya o durumun karşılığı ve kendi
 * <html>/<body> etiketlerini getirmek zorunda.
 *
 * Buraya düşen bir hata ciddi demektir; stil bile yüklenmemiş olabilir, o
 * yüzden renkler satır içinde.
 */

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0b0e11",
          color: "#e8edf1",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "420px" }}>
          <h1 style={{ fontSize: "24px", margin: "0 0 12px" }}>
            Uygulama açılamadı
          </h1>
          <p style={{ color: "#9aa7b1", lineHeight: 1.6, margin: 0 }}>
            Beklenmeyen bir hata oldu. Sayfayı yenilemeyi dene.
            {error.digest ? ` Hata kodu: ${error.digest}` : ""}
          </p>
        </div>
      </body>
    </html>
  );
}
