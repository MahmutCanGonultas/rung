/*
 * Kurtarma formunun durum tipi.
 *
 * Ayrı dosyada duruyor çünkü `"use server"` işaretli bir dosya yalnızca async
 * fonksiyon dışa aktarabiliyor — oraya bir nesne koyunca derleme kırılıyor:
 * "A use server file can only export async functions, found object".
 *
 * Hem sunucudan hem istemciden import ediliyor; içinde sunucuya özel hiçbir şey
 * yok, o yüzden `server-only` işareti de yok.
 */

export type RecoverState = {
  error: string | null;
  /** Adres alındı ve (kayıtlıysa) mail gönderildi. Ekran değişiyor. */
  done: boolean;
  email: string;
};

export const EMPTY_RECOVER_STATE: RecoverState = {
  error: null,
  done: false,
  email: "",
};
