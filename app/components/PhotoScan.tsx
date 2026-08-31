"use client";

import { useId, useRef, useState } from "react";

import { scanPhotoAction } from "../lib/scan-actions";

/*
 * DEFTERDEN EKRANA.
 *
 * Ürün sahibi: "kendi defterimde yazdım diyelim, fotoğrafını çekip attığımda
 * sisteme otomatik geçilebilmeli." Kâğıda yazmak ekranda yazmaktan başka bir
 * şey — el yazısı yavaş, silinmiyor, sözlüğe bakmayı zorlaştırıyor. Yani
 * ölçüm için kâğıt aslında DAHA İYİ bir ortam; eksik olan tek şey metni
 * buraya taşımanın yolu.
 *
 * ÇEVİRİ GÖNDERMİYOR, YAZIYOR. Çıkan metin doğrudan ölçülmüyor; yazma alanına
 * konuyor ve kişi okuyup düzeltiyor. Sebebi ürünün en sert kuralı: yanlış
 * okunan bir kelime, kişinin YAPMADIĞI bir hata olarak ölçüme girerdi.
 */

/*
 * KÜÇÜLTME TARAYICIDA.
 *
 * Telefon kamerası 4000 piksel genişliğinde kareler üretiyor; modelin uzun
 * kenarda ~1500 pikselden fazlasına ihtiyacı yok — fazlası yalnızca token,
 * yani para ve bekleme. Küçültme sunucuda değil burada yapılıyor ki büyük
 * dosya ağdan hiç geçmesin.
 */
const MAX_EDGE = 1500;
const JPEG_QUALITY = 0.78;

async function kucult(file: File): Promise<{ mediaType: string; base64: string }> {
  /*
   * `imageOrientation: "from-image"` ŞART. Telefonlar kareyi sensörün
   * gördüğü gibi kaydedip döndürmeyi EXIF'e yazıyor; bayrağı okumayan bir
   * çizim yan yatmış bir sayfa üretiyor ve model yan yatmış el yazısını
   * okuyamıyor.
   */
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const oran = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * oran));
  const h = Math.max(1, Math.round(bitmap.height * oran));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas yok");
  /* Beyaz zemin: saydam PNG'ler JPEG'e çevrilirken siyah oluyor. */
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const url = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return { mediaType: "image/jpeg", base64: url.slice(url.indexOf(",") + 1) };
}

type Durum =
  | { hal: "bos" }
  | { hal: "calisiyor" }
  | { hal: "hata"; mesaj: string }
  | { hal: "bitti"; supheli: string[] };

export function PhotoScan({
  onText,
}: {
  /** Çevrilen metni yazma alanına ekleyen geri çağırım. */
  onText: (text: string) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [durum, setDurum] = useState<Durum>({ hal: "bos" });

  async function sec(file: File) {
    setDurum({ hal: "calisiyor" });
    try {
      const { mediaType, base64 } = await kucult(file);
      const sonuc = await scanPhotoAction(mediaType, base64);
      if (!sonuc.ok) {
        setDurum({ hal: "hata", mesaj: sonuc.error });
        return;
      }
      onText(sonuc.text);
      setDurum({ hal: "bitti", supheli: sonuc.uncertain });
    } catch {
      setDurum({
        hal: "hata",
        mesaj: "Fotoğraf okunamadı. Başka bir kare dener misin?",
      });
    } finally {
      /* Aynı dosya ikinci kez seçilebilsin: `change` aynı değerde ateşlemiyor. */
      if (input.current) input.current.value = "";
    }
  }

  const calisiyor = durum.hal === "calisiyor";

  return (
    <div className="scan">
      <label className="scan-pick" htmlFor={id}>
        {/*
          Görsel bir düğme ama gerçek bir dosya alanı: `<input type=file>`
          gizlenip `<label>` ile açılıyor. `accept="image/*"` telefonda hem
          kamerayı hem galeriyi sunuyor — `capture` KOYULMADI, çünkü o
          galeriyi kapatıp yalnız kamerayı açıyor ve dün çekilmiş bir
          fotoğrafı yollamayı imkânsız kılıyor.
        */}
        <input
          ref={input}
          id={id}
          className="scan-input"
          type="file"
          accept="image/*"
          disabled={calisiyor}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void sec(file);
          }}
        />
        {calisiyor ? "Okunuyor…" : "Defterinden fotoğraf"}
      </label>

      <p className="scan-note" role="status">
        {durum.hal === "hata" ? (
          <span className="scan-bad">{durum.mesaj}</span>
        ) : durum.hal === "bitti" ? (
          durum.supheli.length > 0 ? (
            <>
              Metin aşağıya geçti. Şu kelimeleri okuyamadım, kontrol et:{" "}
              <b lang="en">{durum.supheli.join(", ")}</b>
            </>
          ) : (
            "Metin aşağıya geçti. Göndermeden önce bir oku — yanlış okuduğum bir kelime senin hatan sayılmasın."
          )
        ) : calisiyor ? (
          "El yazısı okunuyor, birkaç saniye."
        ) : (
          "Kâğıda yazdıysan fotoğrafını at, metne çevireyim. Fotoğraf saklanmıyor."
        )}
      </p>
    </div>
  );
}
