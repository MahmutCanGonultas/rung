/*
 * Sunucu tarafı doğrulama.
 *
 * Tarayıcıdaki `required` / `type="email"` / `minLength` kolaylıktır, güvenlik
 * değildir: form tarayıcı olmadan da gönderilebilir. Kayda giren her değer
 * burada bir daha kontrol edilir.
 */

/*
 * Aynı hesabın "Ali@X.com" ve "ali@x.com" diye ikiye bölünmemesi için.
 *
 * Sondaki `replace` süs değil. JavaScript'te Türkçe büyük İ'nin küçüğü tek harf
 * değil, İKİ kod noktası: "i" + U+0307 (birleşen üstteki nokta).
 *
 *   "İsmail@x.com".toLowerCase()  →  "i̇smail@x.com"   17 kod noktası
 *   "ismail@x.com"                →  "ismail@x.com"    16 kod noktası
 *
 * İkisi eşit değil. Telefonda otomatik büyük harfle "İsmail@x.com" yazıp kayıt
 * olan biri, ertesi gün "ismail@x.com" yazınca hesabını bulamazdı — kalıcı
 * olarak dışarıda kalırdı. Birleşen noktayı atınca ikisi aynı metne düşüyor.
 * U+0307'nin e-posta adresinde anlamlı bir işi yok, atmak güvenli.
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase().replace(/\u0307/g, "").normalize("NFKC");
}

/*
 * Kasten gevşek bir kalıp. E-posta adresinin gerçekten var olup olmadığını
 * tek anlayan şey oraya posta göndermektir; burada amaç sadece bariz
 * bozuklukları elemek. Fazla katı bir kalıp geçerli adresleri reddeder.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Adres alanının veritabanı sınırı; RFC 5321'in pratik üst sınırı. */
const EMAIL_MAX = 254;

export const PASSWORD_MIN = 8;

/*
 * bcrypt girdinin ilk 72 baytını okur, gerisini sessizce atar. "Sessizce"
 * kısmı tehlikeli: 100 karakterlik şifre kuran biri son 28 karakterin hiçbir
 * işe yaramadığını bilmez. Sınırı gizlemek yerine söylüyoruz.
 */
export const PASSWORD_MAX_BYTES = 72;

export function validateEmail(email: string): string | null {
  if (email.length === 0) return "E-posta boş olamaz.";
  if (email.length > EMAIL_MAX) return "E-posta adresi fazla uzun.";
  if (!EMAIL_SHAPE.test(email)) return "E-posta adresi geçerli görünmüyor.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) {
    return `Şifre en az ${PASSWORD_MIN} karakter olmalı.`;
  }

  const bytes = new TextEncoder().encode(password).length;
  if (bytes > PASSWORD_MAX_BYTES) {
    return `Şifre fazla uzun — en fazla ${PASSWORD_MAX_BYTES} bayt (Türkçe harfler iki bayt sayılır).`;
  }

  return null;
}

/** Form alanı string mi diye bakar; dosya yüklenirse veya alan yoksa boş döner. */
export function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
