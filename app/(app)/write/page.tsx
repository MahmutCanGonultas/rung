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

/*
 * YAZMA EKRANI.
 *
 * Görev rastgele seçiliyor — ama seçim adresin İÇİNE yazılıyor. Yazılmasaydı
 * sayfa her çizilişte başka bir görev gösterirdi: kullanıcı metnini yazar,
 * doğrulama hatası alır, sayfa yeniden çizilir ve karşısında bambaşka bir
 * görev bulurdu.
 *
 * KELİME DEFTERİ AŞAĞI İNDİ. Görev ile yazma alanının ARASINDA duruyordu:
 * "Bu görevde B1 bandının üstünde kelime yok. Yine de takıldığın bir kelime
 * varsa deftere al" + bir metin kutusu + bir düğme. Yani buraya yazmaya gelen
 * kişinin gözü, göreve baktıktan sonra yazma alanına inerken üç nesnelik bir
 * kutuya çarpıyordu. Defter kayboldu değil; ihtiyaç duyulan ana taşındı —
 * yazarken takılınca aşağıda duruyor.
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

  const context =
    (params.context ? await findContextBySlug(params.context) : null) ??
    contexts[0];

  /*
   * Görev sabit bir seviyeden değil, KULLANICININ ölçülmüş seviyesinden
   * seçiliyor (plan §06). Hiç kaydı olmayan kullanıcı varsayılandan başlıyor.
   */
  const [level, chosen] = await Promise.all([
    currentLevel(user.id),
    params.task ? findTaskById(params.task) : Promise.resolve(null),
  ]);

  /*
   * Bu dal neredeyse HER ilk istekte çalışıyor — uygulamadaki bütün
   * bağlantılar `?task=` olmadan `/write` diyor. Deftere alınmış kelimeler bu
   * yüzden yönlendirmeden SONRA çekiliyor.
   */
  if (!chosen || chosen.contextId !== context.id) {
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
      <nav className="chips" aria-label="Bağlam">
        {contexts.map((c) => (
          <Link
            key={c.id}
            className={c.id === context.id ? "chip is-on" : "chip"}
            href={`/write?context=${c.slug}`}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <div className="task">
        <h1 className="task-title" lang="en">
          {chosen.prompt}
        </h1>
        <p className="task-meta">
          {chosen.hint}
          <span className="task-sep">·</span>
          {chosen.minWords}–{chosen.maxWords} kelime
          <span className="task-sep">·</span>
          Seviye {chosen.level}
          <Link
            className="task-swap"
            href={`/write?context=${context.slug}&skip=${chosen.id}`}
          >
            başka görev
          </Link>
        </p>
      </div>

      <Composer
        action={saveEntryAction}
        taskId={chosen.id}
        minWords={chosen.minWords}
        maxWords={chosen.maxWords}
      />

      {/*
        Yazarken takılınan kelime buraya. Yazma alanının ÜSTÜNDE değil ALTINDA:
        önce yaz, takılırsan aşağısı burada.
      */}
      <OffBandStrip
        prompt={chosen.prompt}
        level={level}
        taskId={chosen.id}
        back={`/write?context=${context.slug}&task=${chosen.id}`}
        noted={noted}
      />
    </section>
  );
}
