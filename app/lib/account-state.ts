/*
 * Hesap ekranındaki formların durum tipi.
 *
 * Ayrı dosyada duruyor çünkü `"use server"` işaretli bir dosya yalnızca async
 * fonksiyon dışa aktarabiliyor — oraya bir nesne koyunca derleme kırılıyor:
 * "A use server file can only export async functions, found object".
 *
 * Hem sunucudan hem istemciden import ediliyor; içinde sunucuya özel hiçbir
 * şey yok, o yüzden `server-only` işareti de yok.
 */

export type AccountState = {
  error: string | null;
  /** Şifre değişti. Formun yerine tek satırlık bir onay çıkıyor. */
  done: boolean;
};

export const EMPTY_ACCOUNT_STATE: AccountState = { error: null, done: false };
