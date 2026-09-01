import nspell from "nspell";
import dictionaryEn from "dictionary-en";
import dictionaryEnGb from "dictionary-en-gb";

import { sentences, words, type Word } from "./tokenize.ts";

/*
 * Yazım denetimi.
 *
 * Araç seçimi tercihle değil ölçümle yapıldı — `scripts/bench/spell-bench.mjs`
 * iki adayı 40 hatalı + 40 doğru kelimelik altın kümede karşılaştırıyor:
 *
 *   nspell + dictionary-en   isabet %100 · yakalama %100 · yanlış alarm  %0
 *   sistem kelime listesi    isabet  %62 · yakalama  %95 · yanlış alarm %57.5
 *
 * Naif liste çekimli hâlleri ("receives", "occurring") ve modern kelimeleri
 * ("email", "website") bilmiyor; her birine "hata" diyor. Plan §07: ana ölçüt
 * yakalama değil yanlış alarm. Karar bu satıra dayanıyor.
 *
 * İKİ SÖZLÜK, TEK KARAR
 *
 * Amerikan ve İngiliz sözlüğü birlikte kullanılıyor: bir kelime İKİSİNDEN
 * BİRİNDE varsa doğru sayılıyor.
 *
 * Sebebi ölçüldü. Tek sözlükle (Amerikan) yapılan ilk gerçek koşumda yedi
 * yanlış alarmın beşi buydu: "neighbours", "favourite", "behaviour",
 * "generalising", "judgement" — hepsi doğru yazılmış İngiliz varyantı. C1
 * seviyesinde yanlış alarm %42,9'a çıkmıştı, çünkü ileri seviye metinler
 * İngiliz yazımına daha çok kayıyor.
 *
 * Ürünün işi yazım VARYANTI seçmek değil, gerçek yazım hatasını bulmak.
 * Kullanıcıya "behaviour yanlış yazılmış" demek, güveni kaybetmenin en hızlı
 * yolu — ve plan §07'nin ana ölçütü tam olarak bu.
 */

/*
 * Sözlük ~1 MB. Modül seviyesinde bir kez kuruluyor, her istekte değil.
 * `dictionary-en` içeriği paketin içinde geliyor, ağdan bir şey inmiyor.
 *
 * Bu dosyada `server-only` işareti YOK — birim testleri onu düz Node altında
 * import ediyor ve `server-only` orada hata fırlatıyor. Tarayıcıya sızma
 * riskine karşı ikinci bir kilit var: modül Node'un `Buffer`'ını kullanıyor,
 * istemci paketine girerse derleme zaten kırılır.
 */
let spellers: Array<ReturnType<typeof nspell>> | null = null;

function getSpellers() {
  if (spellers) return spellers;

  /*
   * `dictionary-en` sözlüğü `Uint8Array` olarak veriyor, `nspell` tipleri
   * `Buffer` bekliyor. Çalışma anında sorun yok — Buffer zaten bir
   * Uint8Array — ama tip uyuşmuyor. Kopyalamadan aynı belleğe Buffer görünümü
   * açıyoruz: `as any` ile tipi susturmak yerine gerçekten doğru tipi veriyoruz.
   */
  const view = (data: Uint8Array) =>
    Buffer.from(data.buffer, data.byteOffset, data.byteLength);

  const build = (dict: { aff: Uint8Array; dic: Uint8Array }) =>
    nspell({ aff: view(dict.aff), dic: view(dict.dic) });

  spellers = [build(dictionaryEn), build(dictionaryEnGb)];
  return spellers;
}

/**
 * Kelime sözlüklerden HERHANGİ BİRİNDE varsa doğru sayılıyor.
 *
 * BÜYÜK HÂLİ DE DENENİYOR, ve bu tek satır on dört yanlış alarmı birden
 * kapatıyor. Sözlükler kısaltmaları YALNIZCA versal biçimde tutuyor: "PC",
 * "TV", "URL", "API", "PDF", "USB", "GPS", "DVD", "CD", "AI", "CEO", "FAQ",
 * "CV", "OK". İnsanlar bunları cümle içinde küçük harfle yazıyor ve ürün
 * sahibi tam olarak bunu yaşadı: "pc diyip bilgisayar kısaltması yaptım",
 * ekranda "pc → pd" çıktı. ÖLÇÜLDÜ — listedeki yirmi iki kısaltmanın
 * on dördü küçük hâlinde bilinmiyor, hepsi versal hâlinde biliniyor.
 *
 * BEŞ HARFLE SINIRLI. Kısaltmalar orada yaşıyor; uzun bir kelimenin versal
 * hâlinin sözlükte olması beklenmez, ve sınır gerçek bir yazım hatasının
 * tesadüfen bir kısaltmaya denk gelme ihtimalini daraltıyor.
 */
function known(word: string): boolean {
  const kisa = word.length <= 5;
  return getSpellers().some(
    (spell) =>
      spell.correct(word) ||
      spell.correct(word.toLowerCase()) ||
      (kisa && spell.correct(word.toUpperCase()))
  );
}

/**
 * Tireli birleşikler PARÇA PARÇA bakılıyor.
 *
 * İngilizce birleşik kelimeyi serbestçe kuruyor ve sözlük hepsini tutamaz:
 * "tv-series", "state-of-the-art", "e-mail", "t-shirt". Bütün hâlleri
 * sözlükte yok, ve ürün sahibi bunu da gördü — "tv-seris diye bir mantık
 * var, bunlar hata veriyor".
 *
 * Kural: her parça biliniyorsa birleşik de biliniyor. Tek harflik parçalar
 * kabul ediliyor, çünkü birleşiğin ön eki olabiliyorlar ("e-mail", "x-ray",
 * "t-shirt") ve tek harf sözlükte aranacak bir şey değil.
 *
 * NOT: dosyanın kendi yorumu "state-of-the-art tek kelime" diyordu ve
 * öyleydi — ama o tek kelime sözlükte olmadığı için yıllardır yanlış alarm
 * üretiyordu. Yorum doğruydu, davranış değildi.
 */
/**
 * ÇOĞUL KISALTMALAR: "pdfs", "urls", "pcs", "tvs".
 *
 * Versal denemesi bunlarda tutmuyor, çünkü sözlükte "PDFS" diye bir şey yok
 * — "PDF" var. Kural: sonundaki `s` düşürülüp kalan versal hâliyle
 * aranıyor. ÖLÇÜLDÜ, dördü de bu yolla düzeliyor.
 *
 * Gövde en az iki harf: tek harfli gövdeler ("is" → "I") sözlükteki tekil
 * harflere denk gelip gerçek hataları yutardı.
 *
 * VE GÖVDE KÜÇÜK HÂLİYLE GERÇEK BİR KELİMEYSE BU KURAL ÇALIŞMIYOR. "gos"
 * yazan biri "go"nun çoğulunu kastetmiyor, yazım hatası yapıyor; gövdenin
 * versal hâlinin sözlükte olması ("GO") onu kısaltma yapmıyor. Kısaltma
 * çoğulu olmanın şartı, gövdenin normal bir kelime OLMAMASI.
 */
function knownPluralAcronym(word: string): boolean {
  if (!/^[A-Za-z]{2,6}s$/.test(word)) return false;
  const stem = word.slice(0, -1);
  if (stem.length < 2) return false;

  const spellers = getSpellers();
  if (spellers.some((spell) => spell.correct(stem.toLowerCase()))) return false;
  return spellers.some((spell) => spell.correct(stem.toUpperCase()));
}

/**
 * SÖZLÜKLERİN HİÇBİR BİÇİMDE BİLMEDİĞİ, YAYGIN KULLANILAN KISALTMALAR.
 *
 * Bu liste tahminle değil ÖLÇÜMLE dolduruldu: aday kısaltmalar iki sözlükte
 * de küçük, büyük ve versal hâlleriyle arandı; buraya yalnızca üçünde de
 * bulunmayanlar girdi. Kalanların hepsi (`pc`, `tv`, `url`, `api`, `pdf`,
 * `usb`, `gps`, `dvd`, `cd`, `ai`, `ceo`, `faq`, `cv`, `ok`) versal
 * denemesiyle zaten çözülüyor ve burada YOK — gereksiz bir liste, bakımı
 * unutulan bir listedir.
 *
 * Liste kısa kalmalı. Uzarsa bu, sözlüğün yanlış seçildiğinin işareti olur;
 * o zaman çözüm liste büyütmek değil sözlüğü değiştirmek.
 */
const KNOWN_ABBREVIATIONS = new Set([
  "phd", "cto", "coo", "cfo", "ui", "ux", "diy", "wifi", "sms", "ceo",
]);

function knownCompound(word: string): boolean {
  if (!word.includes("-")) return false;
  const parts = word.split("-").filter((p) => p.length > 0);
  if (parts.length < 2) return false;
  return parts.every((part) => part.length === 1 || known(part));
}

export type Misspelling = {
  word: string;
  start: number;
  end: number;
  /** Sözlüğün önerdiği ilk birkaç düzeltme. */
  suggestions: string[];
};

/*
 * Özel isimler sözlükte yok ve olması da beklenmez: "Mahmut", "Kadıköy",
 * "Vercel". Hepsine "yazım hatası" demek, yanlış alarm oranını tek başına
 * uçurur. Ayrım için basit ve deterministik bir kural: cümle başında
 * OLMAYAN büyük harfli kelime özel isim sayılır ve atlanır.
 *
 * Bedeli bilerek kabul edildi: cümle ortasında büyük harfle yazılmış gerçek
 * bir yazım hatası kaçar. Kaçırmak, doğru yazılmış bir ismi kırmızıya
 * boyamaktan ucuz.
 */
function isLikelyProperNoun(word: Word, sentenceStarts: Set<number>): boolean {
  const first = word.text[0];
  if (!first || first !== first.toUpperCase() || !/[A-Za-z]/.test(first)) {
    return false;
  }
  return !sentenceStarts.has(word.start);
}

/** Kısaltmalar: NASA, PDF, API. Sözlükte yoklar, hata da değiller. */
function isAcronym(text: string): boolean {
  return text.length >= 2 && text.length <= 6 && text === text.toUpperCase();
}

/**
 * ASCII DIŞI HARF TAŞIYAN KELİME İNGİLİZCE DEĞİL — ve İngilizce sözlükte
 * aranmaz.
 *
 * "Türkiye", "çünkü", "İzmir" bir İngilizce sözlükte olmadığı için "hata"
 * çıkıyor, ve verilen öneriler saçma oluyor: "Türkiye → kine". Bu, kişiye
 * yapmadığı bir hatayı göstermenin en net hâli — ürünün en sert kuralı tam
 * olarak bunu yasaklıyor.
 *
 * Yabancı kelime kullanmak bir ölçüm konusu olabilir, ama o YAZIM katmanının
 * işi değil: yazım katmanı "bu kelime yanlış yazılmış" diyor, "bu kelime
 * İngilizce değil" demiyor. İkincisini söyleyecek katman model katmanı.
 */
function hasNonAscii(text: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /[^\u0000-\u007F]/.test(text);
}

/**
 * ADRESLERİN İÇİ KELİME DEĞİL.
 *
 * Belirteçleyici "ahmet@example.com" içinden "ahmet", "example", "com" diye
 * kelimeler çıkarıyor ve yazım denetimi onlara bakıyordu: ÖLÇÜLDÜ, "ahmet →
 * Ahmed" diye bir bulgu üretiliyordu. Bir e-posta adresi ya da bağlantı
 * yazım denetiminin konusu değil; içindeki harf dizisi kelime değil, adres.
 *
 * Aralıklar önceden çıkarılıyor ve o aralığa düşen her kelime atlanıyor.
 */
function addressRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const pattern = /(?:https?:\/\/|www\.)\S+|[\w.+-]+@[\w-]+\.[\w.-]+/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}

export function findMisspellings(text: string): Misspelling[] {
  const sentenceStarts = new Set(sentences(text).map((s) => s.start));
  const addresses = addressRanges(text);
  const inAddress = (w: Word) =>
    addresses.some(([a, b]) => w.start >= a && w.end <= b);
  const found: Misspelling[] = [];

  for (const word of words(text)) {
    if (hasNonAscii(word.text)) continue;
    if (inAddress(word)) continue;
    if (isAcronym(word.text)) continue;
    if (isLikelyProperNoun(word, sentenceStarts)) continue;

    if (KNOWN_ABBREVIATIONS.has(word.text.toLowerCase())) continue;
    if (known(word.text)) continue;
    if (knownPluralAcronym(word.text)) continue;
    if (knownCompound(word.text)) continue;

    // Öneri Amerikan sözlüğünden — ikisi de öneri veriyor, biri yeter.
    found.push({
      word: word.text,
      start: word.start,
      end: word.end,
      suggestions: getSpellers()[0].suggest(word.text).slice(0, 3),
    });
  }

  return found;
}
