import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth">
      <div className="auth-card">
        <h1 className="auth-title">Böyle bir sayfa yok</h1>
        <p className="auth-lede">
          Adres yanlış olabilir ya da sayfa taşınmış olabilir.
        </p>
        <Link className="btn btn-primary" href="/">
          Anasayfaya dön
        </Link>
      </div>
    </main>
  );
}
