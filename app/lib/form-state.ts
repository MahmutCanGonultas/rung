/*
 * Form durumu tipi ve başlangıç değeri.
 *
 * Ayrı dosyada duruyor çünkü `"use server"` işaretli bir dosya yalnızca async
 * fonksiyon dışa aktarabiliyor — oraya bir nesne koyunca derleme kırılıyor:
 * "A use server file can only export async functions, found object".
 *
 * Bu dosya hem sunucudan hem istemciden import ediliyor; içinde sunucuya özel
 * hiçbir şey yok, o yüzden `server-only` işareti de yok.
 */

export type FormState = {
  error: string | null;
  email: string;
  /*
   * Kayıt yolunda bağlantı gönderildi ve ekran değişti.
   *
   * Kayıt artık hesap AÇMIYOR: bekleyen bir kayıt yazıp posta kutusuna
   * bağlantı yolluyor. Yani başarı hâli bir yönlendirme değil, "kutuna bak"
   * ekranı — ve bu bayrak onu açıyor. Giriş yolunda hiç kullanılmıyor, orada
   * başarı hâlâ `redirect("/write")`.
   */
  sent?: boolean;
};

export const EMPTY_FORM_STATE: FormState = { error: null, email: "" };
