import { logoutAction } from "../lib/actions";
import { requireUser } from "../lib/guard";

export const metadata = {
  title: "Pano · Rung",
};

export default async function DashboardPage() {
  const user = await requireUser();

  const joined = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(user.createdAt);

  return (
    <main className="shell">
      <header className="shell-bar">
        <span className="mark">
          rung<i>.</i>
        </span>
        <span className="shell-user">{user.email}</span>
        <form action={logoutAction}>
          <button className="btn" type="submit">
            Çıkış
          </button>
        </form>
      </header>

      <section className="panel">
        <h1 className="panel-title">Pano</h1>
        <p className="panel-lede">
          Bu sayfayı sadece giriş yapmış kullanıcılar görebiliyor. Aşama 01'in
          bitiş çizgisi buydu.
        </p>

        <dl className="facts">
          <div>
            <dt>Hesap</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Katılım</dt>
            <dd>{joined}</dd>
          </div>
        </dl>

        <p className="panel-next">
          Sıradaki aşama: bağlam seç, görev al, yaz ve kaydet.
        </p>
      </section>
    </main>
  );
}
