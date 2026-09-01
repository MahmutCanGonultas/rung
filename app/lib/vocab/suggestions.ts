import type { Level } from "../content-types.ts";

/*
 * SENİ BİRAZ ZORLAYACAK KELİMELER.
 *
 * Ürün sahibi: "kişinin seviyesine göre, o kişiyi biraz zorlayacak
 * kelimelerde öner — cümle içinde kullansın diye. Kelimenin Türkçesini yaz,
 * bide fiil mi isim mi onu da söyle. Kullanıcı kullanmak zorunda değil."
 *
 * ÜÇ KARAR
 *
 * 1 · BİR BANT ÜSTÜ, DAHA FAZLASI DEĞİL. B1 ölçülen birine C1 kelimesi
 *     önermek yardım değil caydırmadır. "Biraz zorlayacak" tam olarak bir
 *     basamak demek. C1'de üstü yok; orada yine C1 öneriliyor, çünkü o bant
 *     zaten "listenin dışı", yani sonu olmayan bir yer.
 *
 * 2 · TÜRKÇESİ VE TÜRÜ ŞART. Karşılığı olmayan bir kelime listesi ezber
 *     listesidir. Tür bilgisi ("fiil", "isim") kelimeyi cümleye
 *     YERLEŞTİREBİLMEK için gerekiyor: "achieve" bilmek yetmiyor, nereye
 *     konacağını bilmek gerekiyor.
 *
 * 3 · ZORUNLU DEĞİL, VE EKRAN BUNU SÖYLÜYOR. Bu bir ödev değil; öneri.
 *     Kullanmayan kişi bir şey kaçırmıyor.
 *
 * ELLE DERLENDİ, ve `word-bands.ts` ile aynı dürüstlük kaydı geçerli:
 * lisanslı bir CEFR listesi değil, sıklık ve seviye sezgisine dayanıyor.
 * Yani YAKLAŞIK. Türkçe karşılıklar tek bir kelimeye indirgenmedi — çoğu
 * kelimenin bağlama göre değişen iki karşılığı var ve ikisini de yazmak,
 * birini seçip öbürünü gizlemekten dürüst.
 */

export type PartOfSpeech = "fiil" | "isim" | "sıfat" | "zarf" | "bağlaç";

export type Suggestion = {
  /** İngilizce kelime, kök hâlinde. */
  en: string;
  /** Türkçe karşılık(lar). */
  tr: string;
  pos: PartOfSpeech;
};

/*
 * A1 ölçülen kişiye A2 öneriliyor, A2'ye B1… O yüzden A1 anahtarı YOK:
 * hiç kimseye A1 kelimesi önerilmiyor.
 */
const A2: Suggestion[] = [
  { en: "although", tr: "-e rağmen", pos: "bağlaç" },
  { en: "borrow", tr: "ödünç almak", pos: "fiil" },
  { en: "crowded", tr: "kalabalık", pos: "sıfat" },
  { en: "decide", tr: "karar vermek", pos: "fiil" },
  { en: "describe", tr: "tarif etmek, anlatmak", pos: "fiil" },
  { en: "explain", tr: "açıklamak", pos: "fiil" },
  { en: "however", tr: "ancak, yine de", pos: "zarf" },
  { en: "hurry", tr: "acele etmek", pos: "fiil" },
  { en: "instead", tr: "onun yerine", pos: "zarf" },
  { en: "introduce", tr: "tanıştırmak", pos: "fiil" },
  { en: "invite", tr: "davet etmek", pos: "fiil" },
  { en: "lend", tr: "ödünç vermek", pos: "fiil" },
  { en: "manage", tr: "becermek, idare etmek", pos: "fiil" },
  { en: "neighbour", tr: "komşu", pos: "isim" },
  { en: "opinion", tr: "görüş, fikir", pos: "isim" },
  { en: "perhaps", tr: "belki", pos: "zarf" },
  { en: "prepare", tr: "hazırlamak", pos: "fiil" },
  { en: "probably", tr: "muhtemelen", pos: "zarf" },
  { en: "promise", tr: "söz vermek", pos: "fiil" },
  { en: "reason", tr: "sebep", pos: "isim" },
  { en: "receipt", tr: "fiş, makbuz", pos: "isim" },
  { en: "recommend", tr: "tavsiye etmek", pos: "fiil" },
  { en: "repair", tr: "tamir etmek", pos: "fiil" },
  { en: "suggest", tr: "önermek", pos: "fiil" },
  { en: "surprised", tr: "şaşırmış", pos: "sıfat" },
  { en: "tidy", tr: "düzenli, derli toplu", pos: "sıfat" },
];

const B1: Suggestion[] = [
  { en: "achieve", tr: "başarmak, elde etmek", pos: "fiil" },
  { en: "afford", tr: "parası yetmek", pos: "fiil" },
  { en: "apply", tr: "başvurmak", pos: "fiil" },
  { en: "arrange", tr: "ayarlamak, düzenlemek", pos: "fiil" },
  { en: "attitude", tr: "tutum, tavır", pos: "isim" },
  { en: "avoid", tr: "kaçınmak", pos: "fiil" },
  { en: "benefit", tr: "fayda, yarar", pos: "isim" },
  { en: "complain", tr: "şikâyet etmek", pos: "fiil" },
  { en: "concern", tr: "endişe, kaygı", pos: "isim" },
  { en: "confident", tr: "kendine güvenen", pos: "sıfat" },
  { en: "consider", tr: "göz önüne almak", pos: "fiil" },
  { en: "deserve", tr: "hak etmek", pos: "fiil" },
  { en: "encourage", tr: "cesaretlendirmek", pos: "fiil" },
  { en: "experience", tr: "deneyim", pos: "isim" },
  { en: "improve", tr: "geliştirmek", pos: "fiil" },
  { en: "involve", tr: "içermek, kapsamak", pos: "fiil" },
  { en: "issue", tr: "sorun, mesele", pos: "isim" },
  { en: "opportunity", tr: "fırsat", pos: "isim" },
  { en: "prefer", tr: "tercih etmek", pos: "fiil" },
  { en: "pressure", tr: "baskı", pos: "isim" },
  { en: "reduce", tr: "azaltmak", pos: "fiil" },
  { en: "reliable", tr: "güvenilir", pos: "sıfat" },
  { en: "responsible", tr: "sorumlu", pos: "sıfat" },
  { en: "solve", tr: "çözmek", pos: "fiil" },
  { en: "specific", tr: "belirli, özgül", pos: "sıfat" },
  { en: "suitable", tr: "uygun", pos: "sıfat" },
  { en: "whether", tr: "-ip -mediği", pos: "bağlaç" },
];

const B2: Suggestion[] = [
  { en: "accurate", tr: "doğru, isabetli", pos: "sıfat" },
  { en: "acknowledge", tr: "kabul etmek, teslim etmek", pos: "fiil" },
  { en: "adapt", tr: "uyum sağlamak", pos: "fiil" },
  { en: "assess", tr: "değerlendirmek", pos: "fiil" },
  { en: "assume", tr: "varsaymak", pos: "fiil" },
  { en: "consequence", tr: "sonuç", pos: "isim" },
  { en: "consistent", tr: "tutarlı", pos: "sıfat" },
  { en: "crucial", tr: "çok önemli, kritik", pos: "sıfat" },
  { en: "demonstrate", tr: "göstermek, kanıtlamak", pos: "fiil" },
  { en: "distinguish", tr: "ayırt etmek", pos: "fiil" },
  { en: "emphasise", tr: "vurgulamak", pos: "fiil" },
  { en: "estimate", tr: "tahmin etmek", pos: "fiil" },
  { en: "evidence", tr: "kanıt", pos: "isim" },
  { en: "extent", tr: "ölçü, derece", pos: "isim" },
  { en: "highlight", tr: "öne çıkarmak", pos: "fiil" },
  { en: "implement", tr: "hayata geçirmek, uygulamak", pos: "fiil" },
  { en: "indicate", tr: "göstermek, işaret etmek", pos: "fiil" },
  { en: "maintain", tr: "sürdürmek", pos: "fiil" },
  { en: "occur", tr: "meydana gelmek", pos: "fiil" },
  { en: "outcome", tr: "sonuç, çıktı", pos: "isim" },
  { en: "previous", tr: "önceki", pos: "sıfat" },
  { en: "reluctant", tr: "gönülsüz, isteksiz", pos: "sıfat" },
  { en: "significant", tr: "anlamlı, önemli", pos: "sıfat" },
  { en: "substantial", tr: "hatırı sayılır, epey", pos: "sıfat" },
  { en: "sufficient", tr: "yeterli", pos: "sıfat" },
  { en: "tendency", tr: "eğilim", pos: "isim" },
  { en: "thorough", tr: "etraflı, titiz", pos: "sıfat" },
  { en: "undertake", tr: "üstlenmek", pos: "fiil" },
];

const C1: Suggestion[] = [
  { en: "ambiguous", tr: "belirsiz, iki anlamlı", pos: "sıfat" },
  { en: "arbitrary", tr: "keyfî", pos: "sıfat" },
  { en: "coherent", tr: "tutarlı, bağlantılı", pos: "sıfat" },
  { en: "coincide", tr: "denk gelmek", pos: "fiil" },
  { en: "compelling", tr: "inandırıcı, sürükleyici", pos: "sıfat" },
  { en: "comprehensive", tr: "kapsamlı", pos: "sıfat" },
  { en: "constrain", tr: "kısıtlamak", pos: "fiil" },
  { en: "deteriorate", tr: "kötüleşmek", pos: "fiil" },
  { en: "discrepancy", tr: "tutarsızlık, fark", pos: "isim" },
  { en: "elaborate", tr: "ayrıntılandırmak", pos: "fiil" },
  { en: "inherent", tr: "doğasında olan", pos: "sıfat" },
  { en: "justify", tr: "gerekçelendirmek", pos: "fiil" },
  { en: "mitigate", tr: "hafifletmek", pos: "fiil" },
  { en: "nuance", tr: "ince fark, nüans", pos: "isim" },
  { en: "persistent", tr: "ısrarcı, kalıcı", pos: "sıfat" },
  { en: "plausible", tr: "akla yatkın", pos: "sıfat" },
  { en: "precede", tr: "önce gelmek", pos: "fiil" },
  { en: "prevalent", tr: "yaygın", pos: "sıfat" },
  { en: "reconcile", tr: "bağdaştırmak", pos: "fiil" },
  { en: "refine", tr: "inceltmek, geliştirmek", pos: "fiil" },
  { en: "resilient", tr: "dayanıklı, çabuk toparlanan", pos: "sıfat" },
  { en: "scrutiny", tr: "yakın inceleme", pos: "isim" },
  { en: "subtle", tr: "ince, sezilmesi zor", pos: "sıfat" },
  { en: "ultimately", tr: "sonuçta, nihayetinde", pos: "zarf" },
  { en: "undermine", tr: "zayıflatmak, temelini oymak", pos: "fiil" },
  { en: "viable", tr: "uygulanabilir", pos: "sıfat" },
  { en: "warrant", tr: "gerektirmek", pos: "fiil" },
];

/** Ölçülen seviyenin BİR ÜSTÜ. C1'in üstü yok, orada yine C1. */
const NEXT: Record<Level, { band: Level; list: Suggestion[] }> = {
  A1: { band: "A2", list: A2 },
  A2: { band: "B1", list: B1 },
  B1: { band: "B2", list: B2 },
  B2: { band: "C1", list: C1 },
  C1: { band: "C1", list: C1 },
};

/**
 * Bu kişiye bugün önerilecek kelimeler.
 *
 * SEÇİM RASTGELE DEĞİL, DÖNÜŞÜMLÜ. `Math.random()` kullanılsaydı sunucuda
 * çizilen liste ile istemcide çizilen liste ayrışır (hydration hatası), ve
 * sayfa her yenilendiğinde liste değişip kelimeyi denemeye fırsat bırakmazdı.
 * Tohum kişi + gün: gün boyunca aynı, ertesi gün başka.
 */
export function suggestFor(
  level: Level,
  userId: string,
  today: string,
  count = 4
): { band: Level; words: Suggestion[] } {
  const { band, list } = NEXT[level];

  let seed = 0;
  for (const ch of `${userId}·${today}`) seed = (seed * 31 + ch.charCodeAt(0)) % 100000;

  const picked: Suggestion[] = [];
  const seen = new Set<number>();
  for (let i = 0; picked.length < Math.min(count, list.length); i++) {
    const idx = (seed + i * 7) % list.length;
    if (seen.has(idx)) continue;
    seen.add(idx);
    picked.push(list[idx]);
  }

  return { band, words: picked };
}
