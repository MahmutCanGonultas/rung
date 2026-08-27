import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Composer } from "../../components/Composer";
import { OffBandStrip } from "../../components/OffBandStrip";
import {
  findContextBySlug,
  findTaskById,
  listContexts,
  pickTask,
} from "../../lib/content";
import { currentLevel } from "../../lib/k3/store";
import { saveEntryAction } from "../../lib/entry-actions";
import { requireUser } from "../../lib/guard";
import { notedWords } from "../../lib/vocab/notes";

export const metadata: Metadata = { title: "Yaz · Rung" };

type Search = { context?: string; task?: string; skip?: string };

/** Adres `?context=own` olduğunda görev verilmiyor: konu kullanıcının. */
const OWN = "own";

/*
 * YAZMA EKRANI — iki kip.
 *
 * 1 · GÖREVLE. Bağlam seçiliyor, görev kullanıcının ölçülmüş seviyesinden
 *     rastgele geliyor ve seçim ADRESİN İÇİNE yazılıyor. Yazılmasaydı sayfa
 *     her çizilişte başka bir görev gösterirdi: kullanıcı metnini yazar,
 *     doğrulama hatası alır, sayfa yeniden çizilir ve karşısında bambaşka bir
 *     görev bulurdu.
 *
 * 2 · KENDİ KONUSUNDA. Görev yok, istem yok — sadece yazı alanı.
 *
 * İkinci kip sonradan eklendi ve ürünün eksik yarısıydı: insanların İngilizce
 * yazma ihtiyacı çoğunlukla kendi konularında çıkıyor — bir e-posta, bir
 * mesaj, aklından geçen bir şey. Ölçüm zinciri ikisinde de aynı: K0 metni
 * zaten görevden bağımsız okuyor, model katmanının istemi görev satırlarını
 * yalnızca VARSA ekliyor, ve kayıt görevsiz olarak "Serbest" bağlamına
 * yazılıyor.
 */
export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireUser();

  const params = await searchParams;
  const contexts = await listContexts();
  if (contexts.length === 0) {
    throw new Error("Hiç bağlam yok — `npm run seed` çalıştırıldı mı?");
  }

  const own = params.context === OWN;

  const context =
    (params.context && !own ? await findContextBySlug(params.context) : null) ??
    contexts[0];

  const [level, chosen] = await Promise.all([
    currentLevel(user.id),
    params.task && !own ? findTaskById(params.task) : Promise.resolve(null),
  ]);

  /*
   * Bu dal görevli kipte neredeyse HER ilk istekte çalışıyor — uygulamadaki
   * bütün bağlantılar `?task=` olmadan `/write` diyor.
   */
  if (!own && (!chosen || chosen.contextId !== context.id)) {
    const picked = await pickTask(context.id, level, params.skip);
    if (!picked) {
      throw new Error(
        `${context.name} bağlamında ${level} seviyesinde görev yok.`
      );
    }
    redirect(`/write?context=${context.slug}&task=${picked.id}`);
  }

  const noted = await notedWords(user.id);

  return (
    <section className="write">
      <nav className="chips" aria-label="Ne yazacaksın">
        {contexts.map((c) => (
          <Link
            key={c.id}
            className={!own && c.id === context.id ? "chip is-on" : "chip"}
            href={`/write?context=${c.slug}`}
          >
            {c.name}
          </Link>
        ))}
        {/*
          Kendi konusu bir BAĞLAM DEĞİL, bir kip: görev verilmiyor. Diğerlerinin
          yanında ama araya bir ayraçla duruyor, çünkü aynı türden şey değil.
        */}
        <Link className={own ? "chip is-own is-on" : "chip is-own"} href={`/write?context=${OWN}`}>
          Kendi konum
        </Link>
      </nav>

      {own ? (
        <div className="task">
          <h1 className="task-title">Ne istersen yaz.</h1>
          <p className="task-meta">
            Konu senin — e-posta, mesaj, not, aklından geçen bir şey. Ölçüm
            aynı: hatalar aynı taksonomiye yazılıyor ve kayıt aynı ölçekte
            duruyor.
          </p>
        </div>
      ) : (
        <div className="task">
          <h1 className="task-title" lang="en">
            {chosen!.prompt}
          </h1>
          <p className="task-meta">
            {chosen!.hint}
            <span className="task-sep">·</span>
            {chosen!.minWords}–{chosen!.maxWords} kelime
            <span className="task-sep">·</span>
            Seviye {chosen!.level}
            <Link
              className="task-swap"
              href={`/write?context=${context.slug}&skip=${chosen!.id}`}
            >
              başka görev
            </Link>
          </p>
        </div>
      )}

      <Composer
        action={saveEntryAction}
        taskId={own ? "" : chosen!.id}
        minWords={own ? 10 : chosen!.minWords}
        maxWords={own ? 20000 : chosen!.maxWords}
        placeholder={
          own
            ? "İngilizce yaz. Konu tamamen senin — sözlük kullanma, ölçtüğümüz şey şu anki hâlin."
            : undefined
        }
      />

      {/*
        Yazarken takılınan kelime buraya. Yazma alanının ÜSTÜNDE değil ALTINDA:
        önce yaz, takılırsan aşağısı burada. Kendi konusunda yazarken görevden
        türeyen bir kelime listesi olmuyor, o yüzden şerit yalnız görevli kipte.
      */}
      {own ? null : (
        <OffBandStrip
          prompt={chosen!.prompt}
          level={level}
          taskId={chosen!.id}
          back={`/write?context=${context.slug}&task=${chosen!.id}`}
          noted={noted}
        />
      )}
    </section>
  );
}
