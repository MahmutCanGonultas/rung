import "server-only";

/*
 * Günlükleme.
 *
 * Vercel'de sunucu çıktısı tek bir akışa düşüyor; oradan bir şey bulabilmek
 * için satırların ARANABİLİR olması gerekiyor. Sabit önek ve sabit alan
 * adları bunu sağlıyor: `rung` ile filtrele, `event` ile daralt.
 *
 * NE GÜNLÜKLENMEZ
 * Şifre, oturum jetonu, bağlantı dizesi, API anahtarı — hiçbiri. Ve
 * kullanıcının yazdığı metin de değil: kişisel veri, ve hata ayıklamak için
 * kaydın kimliği yeterli.
 */

type Fields = Record<string, string | number | boolean | null | undefined>;

function line(level: "info" | "warn" | "error", event: string, fields: Fields) {
  const parts = Object.entries(fields)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${typeof v === "string" && v.includes(" ") ? JSON.stringify(v) : v}`);

  return `[rung] ${level} event=${event} ${parts.join(" ")}`.trim();
}

export const log = {
  info(event: string, fields: Fields = {}) {
    console.log(line("info", event, fields));
  },

  warn(event: string, fields: Fields = {}) {
    console.warn(line("warn", event, fields));
  },

  /*
   * Hatanın kendisi ikinci argüman olarak veriliyor — yığın izi (stack trace)
   * kaybolmasın diye. Mesajı metne çevirip yığını atmak, hatayı okunmaz yapar.
   */
  error(event: string, error: unknown, fields: Fields = {}) {
    console.error(line("error", event, fields), error);
  },
};
