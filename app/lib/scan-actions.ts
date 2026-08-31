"use server";

import { log } from "./log";
import { isImageType } from "./scan/contract";
import { transcribe } from "./scan/run";
import { getSessionUser } from "./session";
import { allow } from "./throttle";

/*
 * FOTOĞRAFTAN METİN — sunucu tarafı.
 *
 * Akış: telefon kamerası → tarayıcıda küçültme → buraya base64 → model →
 * yazma alanına metin. Fotoğrafın kendisi HİÇBİR YERE YAZILMIYOR: ne diske,
 * ne veritabanına, ne günlüğe. Çevrilir ve düşer.
 *
 * Sebebi hem gizlilik hem sadelik. Kişinin defter sayfası, üstünde adı, adresi
 * ya da bambaşka bir şey olabilecek bir görüntü; ürünün ona ihtiyacı yok.
 * Saklamadığın veriyi sızdıramazsın.
 */

/*
 * GÜNLÜK SINIR — ölçüm hakkından AYRI.
 *
 * Çeviri bir ölçüm değil, bir yazma yolu: kişi çevirip göndermeyebilir, ya da
 * bulanık çıkan fotoğrafı yeniden çekebilir. Ölçüm hakkını (günde 3) yakmak,
 * kötü çıkan bir fotoğrafın kişiye bir ölçüme mal olması demekti.
 *
 * Ama bedava da değil. ÖLÇÜLDÜ: tarayıcıda küçültülmüş bir defter sayfası
 * 2.995 girdi + 82 çıktı token, yani Sonnet 5 ile çağrı başına $0,0102 ve
 * dört saniye. On çağrı, günün en pahalı hâlinde ~10 sent — üç ölçümün her
 * biri için birden fazla sayfa ve birkaç deneme bırakacak kadar geniş,
 * sınırsız olmayacak kadar dar.
 */
const DAILY_SCANS = 10;

/** Anthropic tek görselde 5 MB kabul ediyor; base64 şişmesiyle birlikte tavan. */
const MAX_BASE64 = 4_500_000;

export type ScanState =
  | { ok: true; text: string; uncertain: string[] }
  | { ok: false; error: string };

export async function scanPhotoAction(
  mediaType: string,
  base64: string
): Promise<ScanState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Oturumun düşmüş. Yeniden gir." };

  if (!isImageType(mediaType)) {
    return { ok: false, error: "Yalnızca JPEG, PNG, WebP ve GIF çevrilebiliyor." };
  }
  if (base64.length === 0) {
    return { ok: false, error: "Fotoğraf boş geldi." };
  }
  if (base64.length > MAX_BASE64) {
    return { ok: false, error: "Fotoğraf çok büyük. Daha küçük bir kare dene." };
  }

  const izin = await allow({
    key: `scan:${user.id}`,
    limit: DAILY_SCANS,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!izin) {
    return {
      ok: false,
      error:
        `Bugünlük fotoğraf çevirme hakkın doldu — günde ${DAILY_SCANS}. ` +
        `Her çeviri bir model çağrısı ve gerçek bir bedeli var. Metni elle de yazabilirsin.`,
    };
  }

  try {
    const sonuc = await transcribe(base64, mediaType);

    /*
     * OKUNAMADIYSA BOŞ METİN DÖNMÜYOR, SEBEP DÖNÜYOR. Boş bir alan "çalışmadı
     * mı, sayfa mı boştu" sorusunu cevapsız bırakırdı.
     */
    if (!sonuc.legible || sonuc.text.trim().length === 0) {
      return {
        ok: false,
        error:
          "Bu karede okunabilir bir yazı bulamadım. Işık iyi olsun, sayfa " +
          "kadraja tam girsin ve fotoğrafı dik çek.",
      };
    }

    return { ok: true, text: sonuc.text.trim(), uncertain: sonuc.uncertain };
  } catch (error) {
    log.error("scan_failed", error, { userId: user.id });
    return {
      ok: false,
      error: "Fotoğraf çevrilemedi. Biraz sonra tekrar dener misin?",
    };
  }
}
