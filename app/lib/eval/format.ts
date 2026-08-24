/*
 * Oran biçimlendirme — TEK YERDE.
 *
 * Aynı sayı iki ekranda iki türlü yazılıyordu: vitrinde `%66,7`, doğruluk
 * panosunda `%66.7`. Türkçede ondalık ayırıcı virgül, yani nokta olan taraf
 * yanlıştı. Kendi doğruluğunu yayımlayan bir ürünün aynı sayıyı iki türlü
 * yazması küçük ama tam da bu sayfanın karşı durduğu cinsten bir tutarsızlık.
 */
export const pct = (x: number) => `%${(x * 100).toFixed(1).replace(".", ",")}`;
