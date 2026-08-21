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
};

export const EMPTY_FORM_STATE: FormState = { error: null, email: "" };
