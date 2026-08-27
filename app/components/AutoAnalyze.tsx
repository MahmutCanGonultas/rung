"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  EMPTY_ANALYSIS_STATE,
  type AnalysisState,
} from "../lib/analysis-state";

/*
 * Ölçümü BAŞLATAN değil, ölçümün BAŞLADIĞINI gösteren bileşen.
 *
 * Buraya kadar akış şuydu: kullanıcı yazar, kaydeder, kaydın sayfası açılır ve
 * orada "Modele sor" diye bir düğme durur. Kimse ona basmaz. Ürünün ana vaadi
 * — yazdığın İngilizcedeki hataları görmek — bir düğmenin arkasında kalıyordu
 * ve sayfayı açan kişi için "yazdım, kaydettim, hiçbir şey olmadı" demekti.
 *
 * Artık sayfa açılır açılmaz kendiliğinden başlıyor.
 *
 * JAVASCRIPT KAPALIYKEN: bu gerçek bir `<form>` ve içinde gerçek bir
 * `<button type="submit">` var. Otomatik gönderim yalnızca bir yan etki —
 * inmezse düğme yerinde duruyor ve elle basılabiliyor. Sayfa hiçbir durumda
 * ölçülemez hâle gelmiyor.
 *
 * DÖNGÜ YOK: `auto` yalnızca HİÇ koşum yapılmamışsa (analysis === null) doğru
 * geliyor. Koşum patlarsa sunucuda "failed" durumuyla saklanıyor, `auto`
 * kapanıyor ve ekranda tekrar deneme düğmesi kalıyor — sonsuz yeniden deneme
 * hem parayı hem kullanıcının sabrını harcardı.
 */

/*
 * Ölçülen: K1 + K2 birlikte ~9 saniye sürüyor (K1 4,5 sn, ikinci geçiş
 * ardından). Bu bekleme gizlenmiyor — boş bir dönen çarkla dokuz saniye
 * beklemek "takıldı" gibi hissettiriyor. Metin ne olduğunu söylüyor, ve
 * deterministik bulgular ZATEN ekranda: kullanıcı boş ekrana değil, yarısı
 * dolu bir listeye bakarak bekliyor.
 */
function Durum({ ilk }: { ilk: boolean }) {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <p className="run-busy" role="status">
        <i className="run-dot" aria-hidden="true" />
        Model katmanı çalışıyor — yorum gerektiren hatalar birkaç saniye içinde
        listeye ekleniyor.
      </p>
    );
  }

  return (
    <button className="btn btn-quiet" type="submit">
      {ilk ? "Model katmanını çalıştır" : "Yeniden ölç"}
    </button>
  );
}

export function AutoAnalyze({
  entryId,
  action,
  auto,
}: {
  entryId: string;
  action: (prev: AnalysisState, formData: FormData) => Promise<AnalysisState>;
  /** Hiç koşum yapılmamış: sayfa açılır açılmaz kendiliğinden başlasın. */
  auto: boolean;
}) {
  const [state, formAction] = useActionState(action, EMPTY_ANALYSIS_STATE);
  const form = useRef<HTMLFormElement>(null);
  const basladi = useRef(false);

  useEffect(() => {
    if (!auto || basladi.current) return;
    /*
     * Ref, React'in geliştirme kipindeki çift çağrısında da aynı kalıyor —
     * `useEffect` iki kez koşsa bile ikinci koşumda `basladi.current` doğru
     * ve ikinci bir model çağrısı gitmiyor.
     */
    basladi.current = true;
    form.current?.requestSubmit();
  }, [auto]);

  return (
    <form className="run" action={formAction} ref={form}>
      <input type="hidden" name="entryId" value={entryId} />
      <Durum ilk={auto} />
      {state.error ? (
        <p className="run-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
