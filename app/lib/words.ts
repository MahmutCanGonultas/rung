/*
 * Kelime sayma.
 *
 * Hem tarayıcıda (yazarken sayaç) hem sunucuda (kaydedilen sayı) aynı sonucu
 * vermesi gerekiyor — bu yüzden `server-only` işareti YOK, ikisi de import
 * ediyor. Sayı iki yerde farklı çıksaydı kullanıcı "90 kelime" görüp sunucudan
 * "89 kelime, yetersiz" cevabı alırdı.
 *
 * Kural basit ve İngilizce metin için yeterli: boşluklara böl, boşları at.
 * Tire "state-of-the-art" tek kelime sayılır — İngilizcede öyle okunuyor.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}
