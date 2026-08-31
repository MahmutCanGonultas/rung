"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { EMPTY_SAVE_STATE, type SaveState } from "../lib/save-state";
import { countWords } from "../lib/words";

/*
 * Yazma alanı. Sınır burada duruyor: sayfanın geri kalanı sunucuda.
 *
 * `countWords` sunucudaki kaydın da kullandığı fonksiyon — sayaçta 74 görüp
 * sunucudan farklı bir sayı almasın diye.
 */

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

export function Composer({
  action,
  taskId,
  minWords,
  maxWords,
  placeholder,
  quotaLeft,
  quotaLimit,
}: Props) {
  const [state, formAction] = useActionState(action, EMPTY_SAVE_STATE);
  const [text, setText] = useState(state.body);

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

  return (
    <form className="composer" action={formAction}>
      <input type="hidden" name="taskId" value={taskId} />

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

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
          {/*
            "kısa" / "uzun" rozetleri SİLİNDİ: rayın kertiği ve dolgusu ikisini
            de gösteriyor, ve rozetler `--fam-turkish` kullanıyordu — yani bir
            TAKSONOMİ AİLE rengini durum bildirmek için kullanıyor, dilin
            "renk sınıflandırmadır" kuralını bozuyorlardı.
          */}
        </span>

        {/*
          Hak, sayacın YANINDA — ayrı bir uyarı kutusu değil. Sınır bir ceza
          değil, ürünün maliyetinin görünür hâli; kendi satırını hak edecek
          kadar da önemli değil.
        */}
        <span className="composer-quota">
          {tukendi
            ? `bugünlük hakkın doldu · ${quotaLimit}/${quotaLimit}`
            : `bugün ${quotaLeft} ölçüm hakkın kaldı`}
        </span>

        <SaveButton words={words} min={10} tukendi={tukendi} />
      </div>
    </form>
  );
}
