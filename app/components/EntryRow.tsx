import Link from "next/link";

import type { EntrySummary } from "../lib/entries";

/*
 * Kayıt listesinin tek satırı.
 *
 * SATIRIN BAŞ ROLÜ KİŞİNİN KENDİ CÜMLESİ.
 *
 * Önceki hâli GÖREVİN metnini büyük yazıyordu. Aynı görevi beş kez yazan
 * biri listede beş özdeş satır görüyordu — ürünün en okunabilir ilerleme
 * kanıtı ("aynı görev, farklı zaman") listeyi okunmaz hâle getiriyordu.
 * Ayırt edici olan tek şey kişinin o gün yazdığı cümle; artık o üstte.
 *
 * Görev kayboldu değil: altta, bağlam ve seviyeyle birlikte küçük satırda.
 *
 * Yoğunluk çubuğu süs değil: listede ilerlemeyi görünür kılan tek şey.
 * Sadece kelime sayısı gösteren bir liste, altı ay sonra "iyileşiyor muyum"
 * sorusuna cevap vermiyor. Çubuk 100 kelimede bulgu sayısını gösteriyor; 12
 * ve üstü tam dolu sayılıyor — A1 seviyesinde tipik üst sınır. Ölçek sabit,
 * yoksa iki liste karşılaştırılamaz.
 */

const FULL_SCALE = 12;

const DAY = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Istanbul",
});

/*
 * Kırpma KELİME SINIRINDA. Karakterden kesmek "informati…" gibi yarım
 * kelimeler üretiyor ve göz onları okumak için duruyor.
 */
function firstLine(text: string, max = 96): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut) + "…";
}

/*
 * `hideTask`: görev satırını gizler.
 *
 * Kayıt ayrıntı sayfasındaki "aynı görevi daha önce de yazmışsın" listesinde
 * bütün satırlar TANIM GEREĞİ aynı görev. Orada her satırın altına aynı görev
 * cümlesini kırpılmış hâlde yazmak, beş kez aynı şeyi söylemek ve satırı
 * kalabalıklaştırmaktan başka bir şey yapmıyordu.
 */
export function EntryRow({
  entry,
  hideTask = false,
}: {
  entry: EntrySummary;
  hideTask?: boolean;
}) {
  const width =
    entry.per100 === null
      ? 0
      : Math.min(100, (entry.per100 / FULL_SCALE) * 100);

  return (
    <Link className="entry-row" href={`/entries/${entry.id}`}>
      <span className="entry-day">{DAY.format(entry.createdAt)}</span>

      <span className="entry-main">
        {/* Kişinin kendi cümlesi — satırı ayırt eden şey. */}
        <span className="entry-snippet" lang="en">
          {firstLine(entry.snippet)}
        </span>

        <span className="entry-meta">
          {/*
            Metnin ÖLÇÜLEN seviyesi. Ölçülmemişse rozet hiç çizilmiyor —
            varsayılan bir bant koymak, olmayan bir ölçümü varmış gibi
            göstermek olurdu. Kısa metinde tahmin oynak olduğu için o durumda
            çerçeve kesikli.
          */}
          {entry.level ? (
            <span
              className={entry.levelReliable ? "row-level" : "row-level is-soft"}
              title={
                entry.levelReliable
                  ? `Bu metnin ölçülen seviyesi: ${entry.level}`
                  : `Bu metnin ölçülen seviyesi: ${entry.level} — metin kısa olduğu için oynak`
              }
            >
              {entry.level}
            </span>
          ) : null}
          <span className="entry-where">{entry.contextName}</span>
          {/*
            Ayraç noktaları AYRI SPAN DEĞİL. Öyleyken satır sarınca nokta
            önceki satırın sonunda kalıyordu — mobilde her satır bir "·" ile
            bitiyor, yazım hatası gibi duruyordu. Şimdi nokta CSS'te
            `::before` olarak kendinden sonraki ögeye bağlı: öge sararsa
            noktası da onunla sarıyor.
          */}
          <span className="entry-words">{entry.wordCount} kelime</span>
          {entry.taskPrompt && !hideTask ? (
            <span className="entry-task" lang="en">
              {firstLine(entry.taskPrompt, 52)}
            </span>
          ) : null}
        </span>
      </span>

      <span className="entry-dens">
        {entry.per100 === null ? (
          <span className="entry-pending">analiz edilmedi</span>
        ) : (
          <>
            <span className="entry-bar">
              <i style={{ width: `${width}%` }} />
            </span>
            <span className="entry-num">
              {entry.per100.toFixed(1).replace(".", ",")}
            </span>
          </>
        )}
      </span>
    </Link>
  );
}
