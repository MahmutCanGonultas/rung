import "server-only";

import { db } from "./db";
import { log } from "./log";

/*
 * HIZ SINIRI — kayan pencere.
 *
 * Şifre sıfırlama isteği, kimlik doğrulamadan çalışan tek yazma yolu: hiç
 * oturum açmadan, sadece bir adres yazarak sunucuya mail attırabiliyorsun.
 * Sınırsız bırakılırsa iki şey oluyor: birinin kutusu bombalanıyor ve
 * sağlayıcının günlük kotası (300) yanıyor.
 *
 * NEDEN KAYAN PENCERE: sabit pencerede sayaç ilk isteğin saatinde sıfırlanıyor
 * ve saldırgan pencerenin sonunda + yeni pencerenin başında iki katını
 * gönderebiliyor. Burada damgalar tek tek duruyor ve pencere her sorguda
 * "şimdiden geriye" hesaplanıyor.
 */

export type Bucket = { key: string; limit: number; windowMs: number };

/*
 * SINIRIN AŞILMASI İSTEĞİ SESSİZCE DÜŞÜRÜYOR, HATA VERMİYOR.
 *
 * Çağıran taraf ekranda hep aynı cümleyi gösteriyor ("adres kayıtlıysa
 * gönderdik"). Sınıra takıldığını söylemek, o adresin kayıtlı olduğunu
 * söylemenin dolaylı yolu olurdu.
 */
export async function allow(bucket: Bucket): Promise<boolean> {
  /*
   * ANAHTAR BOŞ OLAMAZ. IP okunamadığında anahtar `reset-ip:` oluyordu ve
   * bütün dünya tek kovaya düşüyordu: onuncu istekten sonra site kendini
   * herkese kapatıyordu. Boş anahtar artık sınırlanmıyor — kimliği
   * bilinmeyen bir isteği kısıtlamak, bilinenleri cezalandırmaktan iyi değil.
   */
  const key = bucket.key.trim();
  if (key.endsWith(":") || key.length === 0) return true;

  const since = new Date(Date.now() - bucket.windowMs).toISOString();

  try {
    const rows = (await db()`
      SELECT count(*)::int AS n
        FROM auth_attempts
       WHERE bucket = ${key}
         AND created_at > ${since}
    `) as Array<{ n: number }>;

    if (rows[0].n >= bucket.limit) return false;

    await db()`INSERT INTO auth_attempts (bucket) VALUES (${key})`;
    return true;
  } catch (error) {
    /*
     * VERİTABANI PATLARSA GEÇİR.
     *
     * Neon HTTP sürücüsü tek bir HTTPS isteği; soğuk başlangıçta ya da
     * dalgalanmada bu sorgu patlayabiliyor. Hata yukarı fırlasaydı kullanıcı
     * şifresini sıfırlayamıyordu — yani veritabanı hıçkırığı hesabı kilitli
     * tutuyordu. Sınır bir emniyet, bir kapı değil: patladığında kapıyı
     * kapatmıyor, kendini devre dışı bırakıyor.
     */
    log.error("throttle_failed_open", error, { bucket: key });
    return true;
  }
}

/*
 * Eski damgaları toplar. Tabloyu şişirmemek için, her istekte değil, sınır
 * kontrolünün yanında seyrek çağrılıyor.
 */
export async function sweepAttempts(): Promise<void> {
  try {
    await db()`DELETE FROM auth_attempts WHERE created_at < now() - interval '2 days'`;
  } catch (error) {
    log.error("throttle_sweep_failed", error, {});
  }
}
