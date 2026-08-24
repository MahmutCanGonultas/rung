import type { CSSProperties } from "react";

/*
 * Beş katmanlı analiz hattı.
 *
 * Ürünün ayırt edici iddiası burada: beş katmanın ÜÇÜ model kullanmıyor.
 * Mor olanlar modele giden iki katman — göz bir bakışta ayırsın diye.
 */

const LAYERS = [
  {
    code: "K0",
    name: "Deterministik",
    what: "Yazım, kurallar, kelime bandı, karmaşıklık",
    model: false,
  },
  {
    code: "K1",
    name: "Model çıkarımı",
    what: "Sabit taksonomiye ve zorunlu şemaya yazmak zorunda",
    model: true,
  },
  {
    code: "K2",
    name: "İkinci geçiş",
    what: "Her bulguya bağımsız olarak “bu gerçekten hata mı”",
    model: true,
  },
  {
    code: "K3",
    name: "Seviyeye göre süzme",
    what: "A1’e üç bulgu, C1’e hepsi — aynı metin, farklı geri bildirim",
    model: false,
  },
  {
    code: "K4",
    name: "Sürümlü kayıt",
    what: "Model kimliği ve prompt sürümü kayda yazılır",
    model: false,
  },
];

export function Pipeline() {
  return (
    <div className="pipe" aria-label="Analiz hattı: beş katman">
      {LAYERS.map((layer, i) => (
        <div
          key={layer.code}
          className={layer.model ? "pipe-cell is-ai" : "pipe-cell"}
          style={{ "--i": String(i) } as CSSProperties}
        >
          <span className="pipe-code">{layer.code}</span>
          <span className="pipe-name">{layer.name}</span>
          <span className="pipe-what">{layer.what}</span>
          <span className="pipe-tag">
            {layer.model ? "model" : "yapay zekâ yok"}
          </span>
        </div>
      ))}
    </div>
  );
}
