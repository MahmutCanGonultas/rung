/*
 * Sıfırlama jetonunu taşıyan geçici çerezin adı.
 *
 * Ayrı dosyada: hem `"use server"` eylemleri hem de bir route handler bunu
 * okuyor, ve `"use server"` dosyası sabit dışa aktaramıyor.
 */
export const RESET_COOKIE = "rung_reset";
