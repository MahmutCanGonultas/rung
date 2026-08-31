"use client";

/*
 * Kök layout'un kendisi patlarsa `app/error.tsx` de çizilemez — çünkü o da
 * kök layout'un içinde yaşıyor. Bu dosya o durumun karşılığı ve kendi
 * <html>/<body> etiketlerini getirmek zorunda.
 *
 * Buraya düşen bir hata ciddi demektir; stil bile yüklenmemiş olabilir, o
 * yüzden renkler satır içinde.
 *
 * RENKLER MARKANIN. Bu ekran arduvaz-mavi bir palette kalmıştı (#0b0e11 /
 * #e8edf1 / #9aa7b1) — sitenin geri kalanı erik ve kayısıyken. Değerler
 * artık koyu temanın kendi jetonlarının değerleri; jeton kullanılamıyor,
 * çünkü bu ekranın hiç CSS'i olmayabilir.
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
          background: "#1c1417",
          color: "#f8efe9",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "420px" }}>
          <h1 style={{ fontSize: "24px", margin: "0 0 12px" }}>
            Uygulama açılamadı
          </h1>
          <p style={{ color: "#b09aa0", lineHeight: 1.6, margin: 0 }}>
            Beklenmeyen bir hata oldu. Sayfayı yenilemeyi dene.
            {error.digest ? ` Hata kodu: ${error.digest}` : ""}
          </p>
        </div>
      </body>
    </html>
  );
}
