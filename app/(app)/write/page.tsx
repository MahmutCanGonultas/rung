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
import { dailyQuota } from "../../lib/entries";
import { requireUser } from "../../lib/guard";
import { notedWords } from "../../lib/vocab/notes";

export const metadata: Metadata = { title: "Yaz · Rung" };

type Search = {
  context?: string;
  task?: string;
  skip?: string;
  dogrulama?: string;
};

/*
 * Doğrulama akışı giriş yapmış kullanıcıyı BURAYA geri gönderiyor: `/login`e
 * dönseydi oturumu olan kişi oradan yeniden `/write`e atılırdı ve sonuç mesajı
 * yolda kaybolurdu — ÖLÇÜLDÜ, bağlantıya tıklayan hiçbir şey görmüyordu.
 *
 * Mesaj sayfada, layout'ta değil: Next'te layout `searchParams` almıyor.
 */
const HABER: Record<string, string> = {
  /* Bekleyen kayıt bağlantısı tıklandı: hesap BU AN açıldı. */
  hesap: "Hesabın açıldı ve adresin doğrulandı. İlk paragrafını yazabilirsin.",
  tamam: "E-posta adresin doğrulandı. Şifreni unutsan da geri dönebilirsin.",
  zaten: "Bu adres zaten doğrulanmıştı.",
  suresiz: "O bağlantının süresi dolmuştu — yirmi dört saat geçerliydi.",
  gecersiz: "Doğrulama bağlantısı geçersiz ya da süresi dolmuş.",
  hata: "Doğrulama sırasında bir şey ters gitti. Biraz sonra tekrar dene.",
};

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
  /*
   * Bağlam listesi ve günlük hak birbirine bağlı değil — paralel okunuyor,
   * yoksa sayfa iki gidiş-dönüş bekliyor.
   */
  const [contexts, quota] = await Promise.all([
    listContexts(),
    dailyQuota(user.id),
  ]);
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
    /*
     * Bayrak yönlendirmede TAŞINIYOR. Doğrulama bağlantısı `/write?dogrulama=`
     * ile geliyor ve bu dal (görev seçimi) neredeyse her ilk istekte çalışıyor;
     * bayrak burada düşseydi kullanıcı doğrulandığına dair hiçbir şey görmezdi.
     */
    const flag = params.dogrulama ? `&dogrulama=${params.dogrulama}` : "";
    redirect(`/write?context=${context.slug}&task=${picked.id}${flag}`);
  }

  const noted = await notedWords(user.id);
  const haber = params.dogrulama ? HABER[params.dogrulama] : null;

  return (
    <section className="write">
      {haber ? (
        <p className="gate-news" role="status">
          {haber}
        </p>
      ) : null}

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
            {/*
              Ayraç noktası kendinden SONRAKİ parçanın içinde. Ayrı bir span
              iken satır sarımı onu önceki satırın sonunda bırakıyordu ve
              390px'te satır boşlukta duran bir "·" ile bitiyordu.
            */}
            {/*
              Hedef aralığı BURADAN kalktı: aynı sayı altı yüz piksel aşağıda,
              ULAŞILAN sayının yanında duruyor ve hemen üstündeki ray onu
              gösteriyor. Hedef, ölçülen şeyin yanında anlamlı; görev
              başlığının altında yalnızca bir sayı.
            */}
            <span className="task-part">Seviye {chosen!.level}</span>
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
        quotaLeft={quota.left}
        quotaLimit={quota.limit}
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
