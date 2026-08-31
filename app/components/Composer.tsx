"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { saveDraftAction } from "../lib/draft-actions";
import { PhotoScan } from "./PhotoScan";
import { EMPTY_SAVE_STATE, type SaveState } from "../lib/save-state";
import { countWords } from "../lib/words";

/*
 * Yazma alanı. Sınır burada duruyor: sayfanın geri kalanı sunucuda.
 *
 * `countWords` sunucudaki kaydın da kullandığı fonksiyon — sayaçta 74 görüp
 * sunucudan farklı bir sayı almasın diye.
 */

/*
 * OTOMATİK TASLAK KAYDI — kaç milisaniye sessizlikten sonra.
 *
 * "Taslağı kaydet" düğmesi düşünüldü ve elendi: tarayıcı çöktüğünde, telefon
 * çaldığında ya da sekme yanlışlıkla kapandığında kimse o düğmeye basmış
 * olmuyor. Kaydı hatırlaması gereken şey kişi değil, alet.
 *
 * 1800 ms bir denge: daha kısası her kelimede bir sunucuya gidiyor, daha
 * uzunu düşünmek için duran birinin yazdığını riske atıyor.
 */
const AUTOSAVE_MS = 1800;

const SAAT = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

type Props = {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  /** Boş dizgi: kendi konusunda yazıyor, görev yok. */
  taskId: string;
  minWords: number;
  maxWords: number;
  placeholder?: string;
  /** Bugün kaç ölçüm hakkı kaldı. Gerçek sınır sunucuda. */
  quotaLeft: number;
  quotaLimit: number;
  /** Bu yazma durumunda yarım kalmış metin. ISO dizgisi: sunucudan geçiyor. */
  draft?: { body: string; savedAt: string } | null;
};

function SaveButton({
  words,
  min,
  tukendi,
}: {
  words: number;
  min: number;
  /* Hak bitti: düğme kapalı ama METİN DURUYOR — yazdığını kaybetme. */
  tukendi: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="btn btn-primary"
      type="submit"
      disabled={pending || words < min || tukendi}
    >
      {pending ? "Kaydediliyor…" : tukendi ? "Yarın" : "Kaydet"}
    </button>
  );
}

type DraftDurum = "yok" | "bekliyor" | "kayitli" | "hata";

export function Composer({
  action,
  taskId,
  minWords,
  maxWords,
  placeholder,
  quotaLeft,
  quotaLimit,
  draft = null,
}: Props) {
  const [state, formAction] = useActionState(action, EMPTY_SAVE_STATE);
  const [text, setText] = useState(draft?.body ?? state.body);

  /*
   * SON KAYDEDİLEN METİN bir ref'te, state'te değil: değeri değiştiğinde
   * yeniden çizmeye gerek yok, ve otomatik kayıt etkisinin ona bakması onu
   * bağımlılık listesine sokmamalı — sokarsa etki kendi kaydından sonra
   * yeniden kurulur ve zincir kopmaz.
   */
  const sonKayit = useRef(draft?.body ?? "");
  /* Ekrandaki güncel metin, çizimden bağımsız okunabilsin diye. Değeri
     aşağıdaki etkinin başında yazılıyor — çizim sırasında ref'e yazmak,
     iptal edilen bir çizimde yanlış değeri bırakabilir. */
  const metin = useRef(text);

  const [durum, setDurum] = useState<DraftDurum>(draft ? "kayitli" : "yok");
  const [savedAt, setSavedAt] = useState<string | null>(draft?.savedAt ?? null);

  /*
   * DEBOUNCE: yazmayı bırakınca kaydediyor.
   *
   * Etki her tuşta yeniden kuruluyor ve bir öncekinin zamanlayıcısını
   * temizliyor, yani ağa yalnızca DURAKLAMADA gidiliyor. Aralıksız yazan biri
   * için tek bir istek bile çıkmıyor — duruşu bekliyor.
   */
  useEffect(() => {
    metin.current = text;
    if (text === sonKayit.current) return;
    /*
     * AYNI DEĞERE AYNI DEĞERİ YAZMAK YENİDEN ÇİZİM ÜRETMESİN.
     *
     * Düz `setDurum("bekliyor")` her tuşta ikinci bir durum güncellemesi
     * demekti ve kontrollü bir `<textarea>` için bunun bedeli var: alan her
     * çizimde React'in tuttuğu değere geri konuyor, ve çizim tuşa
     * yetişemezse ARADAKİ KARAKTERLER DÜŞÜYOR. ÖLÇÜLDÜ — duman testinde
     * kelime sayacı 57 yerine 55 gösterdi ve kaydedilen metinde "agreement
     * said" yerine "agreements" vardı.
     *
     * Fonksiyonlu güncellemede React aynı değeri görünce çizimi atlıyor:
     * tuş başına tek çizim kalıyor, yani taslaktan önceki davranış.
     */
    setDurum((d) => (d === "bekliyor" ? d : "bekliyor"));

    const zaman = setTimeout(async () => {
      const sonuc = await saveDraftAction(taskId, text);
      /*
       * KAYITTAN SONRA METİN DEĞİŞMİŞ OLABİLİR. Kişi istek uçarken yazmaya
       * devam ettiyse "kaydedildi" demek yalan olur — o durumda bir sonraki
       * duraklama zaten yeni bir kayıt açıyor.
       */
      if (metin.current !== text) return;
      if (sonuc.ok) {
        sonKayit.current = text;
        setSavedAt(sonuc.savedAt);
        setDurum(sonuc.empty ? "yok" : "kayitli");
      } else {
        setDurum("hata");
      }
    }, AUTOSAVE_MS);

    return () => clearTimeout(zaman);
  }, [text, taskId]);

  /*
   * SEKME ARKA PLANA DÜŞERKEN SON BİR KAYIT.
   *
   * Debounce 1800 ms bekliyor; sekmeyi o aralıkta kapatan biri son cümlesini
   * kaybederdi. `visibilitychange` sekme gizlenirken ateşleniyor ve mobilde
   * uygulamadan çıkışta da çalışıyor — `beforeunload` telefonlarda güvenilir
   * değil, bu güvenilir.
   */
  useEffect(() => {
    function bosalt() {
      if (document.visibilityState !== "hidden") return;
      if (metin.current === sonKayit.current) return;
      const anlik = metin.current;
      void saveDraftAction(taskId, anlik).then((sonuc) => {
        if (sonuc.ok) sonKayit.current = anlik;
      });
    }
    document.addEventListener("visibilitychange", bosalt);
    return () => document.removeEventListener("visibilitychange", bosalt);
  }, [taskId]);

  /*
   * KALAN HAK EKRANDA — ama sınır burada DEĞİL, sunucuda.
   *
   * Burada gösterilen şey bir bilgi: kişi kaydet düğmesine bastıktan sonra
   * "hakkın doldu" duymasın, önceden bilsin. Formun kendisi tarayıcısız da
   * gönderilebiliyor, o yüzden gerçek kontrol `saveEntryAction` içinde.
   */
  const tukendi = quotaLeft <= 0;

  const words = countWords(text);
  /*
   * Hedefi AŞMAK bir hata değil. Ray dolduktan sonra rengini sakinleştiriyor
   * — "yeter" diyor, "yanlış" demiyor. Uzun yazmak ölçümü bozmuyor.
   */
  const asti = words > maxWords;

  /*
   * FOTOĞRAFTAN GELEN METİN EKLENİYOR, DEĞİŞTİRİLMİYOR.
   *
   * Yazma alanında bir şey varsa çeviri onun ALTINA, boş bir satır bırakarak
   * giriyor. Üstüne yazmak, defterin ikinci sayfasını çeken birinin birinci
   * sayfasını silmek olurdu — ve çok sayfalı bir metin bu ürünün olağan
   * hâli: her kare bir sayfa.
   */
  function fotograftanEkle(gelen: string) {
    setText((onceki) => (onceki.trim() ? `${onceki.trimEnd()}\n\n${gelen}` : gelen));
  }

  async function taslagiAt() {
    setText("");
    sonKayit.current = "";
    setDurum("yok");
    setSavedAt(null);
    await saveDraftAction(taskId, "");
  }

  return (
    <form className="composer" action={formAction}>
      <input type="hidden" name="taskId" value={taskId} />

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      {/*
        Fotoğraf yolu yazma alanının ÜSTÜNDE: sıra böyle — önce metni
        getiriyorsun, sonra okuyup düzeltiyorsun.
      */}
      <PhotoScan onText={fotograftanEkle} />

      <textarea
        className="editor"
        name="body"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={
          placeholder ??
          "Buraya İngilizce yaz. Sözlük kullanma — ölçtüğümüz şey şu anki hâlin."
        }
        rows={14}
        lang="en"
        spellCheck={false}
        aria-label="Metin"
      />

      {/*
        HEDEF RAYI — yazarken canlanan tek şey.
        
        Bu ekranın işi bir boş dikdörtgen, ama altında dört ayrı nesne
        duruyordu ve hedef yalnızca bir sayı olarak fısıldanıyordu ("hedef
        100–140"). Ray hedefi GÖSTERİYOR: dolgu yazdıkça büyüyor, kertik
        alt sınırın olduğu yerde duruyor.
        
        GÖREV YOKSA HİÇ ÇİZİLMİYOR. Kendi konusunda yazarken bir hedef
        aralığı yok; olmayan bir hedefi varmış gibi göstermek, ürünün
        karşı durduğu şeyin ta kendisi olurdu.
        
        `aria-hidden`: kelime sayısı ve hedef zaten METİN olarak yanında
        duruyor, ray onların görsel karşılığı. Ekran okuyucuya aynı şeyi
        iki kez söylemiyoruz.
      */}
      {taskId ? (
        <span className="composer-rail" aria-hidden="true">
          <i
            className={asti ? "composer-rail-fill is-full" : "composer-rail-fill"}
            style={{ width: `${Math.min(100, (words / maxWords) * 100)}%` }}
          />
          <i
            className="composer-rail-min"
            style={{ insetInlineStart: `${(minWords / maxWords) * 100}%` }}
          />
        </span>
      ) : null}

      <div className="composer-foot">
        <span className="composer-count">
          <b>{words}</b> kelime
          {/* Hedef aralık GÖREVDEN geliyor; kendi konusunda yazarken böyle bir
              hedef yok ve uydurulmuş bir aralık göstermek yanlış olurdu. */}
          {taskId ? (
            <span className="composer-target">
              {" · hedef "}
              {minWords}–{maxWords}
            </span>
          ) : null}
        </span>

        {/*
          TASLAK DURUMU — sessiz ama görünür.
          
          `role="status"`: ekran okuyucu yazarken bölünmesin diye kibar
          bildirim. Metin her duruşta değişiyor, `aria-live="polite"` bunu
          sıraya koyuyor.
        */}
        <span className="composer-draft" role="status">
          {durum === "bekliyor" ? "taslağa yazılıyor…" : null}
          {durum === "hata" ? "taslak kaydedilemedi" : null}
          {durum === "kayitli" && savedAt
            ? `taslak kaydedildi · ${SAAT.format(new Date(savedAt))}`
            : null}
          {durum === "kayitli" || durum === "bekliyor" ? (
            <button className="composer-drop" type="button" onClick={taslagiAt}>
              temizle
            </button>
          ) : null}
        </span>

        {/*
          Hak, sayacın YANINDA — ayrı bir uyarı kutusu değil. Sınır bir ceza
          değil, ürünün maliyetinin görünür hâli; kendi satırını hak edecek
          kadar da önemli değil.
          
          HAK DOLDUĞUNDA CÜMLE DEĞİŞTİ: artık yazdığının kaybolmayacağını da
          söylüyor. Taslaktan önce doğru değildi — metin ekranda duruyordu ama
          sayfadan çıkınca gidiyordu.
        */}
        <span className="composer-quota">
          {tukendi
            ? `bugünlük hakkın doldu · yazdığın taslakta kalıyor`
            : `bugün ${quotaLeft} ölçüm hakkın kaldı`}
        </span>

        <SaveButton words={words} min={10} tukendi={tukendi} />
      </div>
    </form>
  );
}
