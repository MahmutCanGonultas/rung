/*
 * E-POSTA GÖVDESİ — saf, sınanabilir kısım.
 *
 * NEDEN AYRI DOSYA: `email.ts` günlük tutuyor ve `log.ts` `server-only`
 * işaretli; onu import eden her şey `node --test` altında patlıyor. Yükün
 * kendisi ise saf veri — ağ da yok, ortam değişkeni de yok — ve tam olarak
 * SINANMASI GEREKEN yer burası.
 *
 * NEDEN ÖNEMLİ: bu yükler üretimde sessizce yanlış olabiliyor. Brevo'nun
 * `Authorization: Bearer` değil `api-key` başlığı istemesi, Resend'in ham
 * JSON'da `replyTo` değil `reply_to` beklemesi — ikisi de 401 ya da sessiz
 * bir eksikle dönüyor, ve bunlar tam da kimsenin bakmadığı anda, birinin
 * şifresini unuttuğu anda çalışan kod.
 *
 * Alan adları 30 Ağustos 2026'da sağlayıcıların kendi belgelerinden
 * doğrulandı, hafızadan yazılmadı.
 */

export type Mail = {
  to: string;
  subject: string;
  /** Düz metin gövde. HTML'i buradan türetiliyor — tek kaynak. */
  text: string;
};

export type Envelope = {
  from: string;
  fromName: string;
  /*
   * Cevapların gideceği adres. `from` bir alan adına ait ama o alan adının
   * MX kaydı YOK — yani gönderdiğimiz adrese yazılan cevap hiçbir yere
   * gitmiyor. Bu alan doluysa cevap gerçek bir kutuya düşüyor.
   *
   * Boşsa hiç yazılmıyor: boş bir `reply_to` göndermek, sağlayıcıya
   * doğrulaması gereken geçersiz bir adres vermek olurdu.
   */
  replyTo?: string;
};

/*
 * Bağlantının tam adresi.
 *
 * `new URL(path, base)` yolu tabana göre çözüyor. Taban sonunda eğik çizgi
 * olsa da olmasa da aynı sonucu veriyor, ve `path` başında eğik çizgiyle
 * geldiği için taban yolunun geri kalanını değil KÖKÜ alıyor.
 */
export function buildLink(path: string, appUrl: string): string {
  return new URL(path, appUrl).toString();
}

/*
 * Düz metinden HTML. Ayrı bir şablon tutulmuyor: iki gövdeyi elde ayrı ayrı
 * güncellemek, birinin eskimesi demek. Bağlantılar tıklanabilir oluyor,
 * gerisi paragraf.
 */
export function toHtml(text: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const body = escape(text)
    .split(/\n{2,}/)
    .map((para) => {
      const withLinks = para.replace(/(https?:\/\/\S+)/g, (url) => {
        /*
         * GÖRÜNEN METİN JETONU GÖSTERMİYOR.
         *
         * Önceden bağlantının metni ham URL'nin kendisiydi, yani ekranda
         * 43 karakterlik rastgele bir jeton duruyordu — saatler yaşındaki
         * bir alan adına giden, uzun ve okunamaz bir adres. Bu birebir
         * oltalama (phishing) mailinin şekli, ve filtrenin elinde başka
         * sinyal yokken karar tam olarak şekle bakıyor. ÖLÇÜLDÜ: ilk gerçek
         * doğrulama maili Outlook'ta gereksiz klasörüne düştü.
         *
         * Google'ın gönderen kılavuzu da bunu istiyor: "Web links in the
         * message body should be visible and easy to understand."
         *
         * ALAN ADI ASLA DEĞİŞMİYOR. Görünen metin, gerçekten gidilen adresin
         * host + yol kısmı — yalnızca sorgu dizesi kırpılıyor. Görünen alan
         * adı ile gerçek alan adı farklı olsaydı, asıl oltalama sinyali o
         * olurdu.
         */
        const label = url.replace(/^https?:\/\//, "").split("?")[0];
        return `<a href="${url}" style="color:#a03a1e">${label}</a>`;
      });
      return `<p style="margin:0 0 16px">${withLinks.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  return (
    `<!doctype html><html lang="tr"><body style="margin:0;background:#fcf7f3">` +
    `<div style="max-width:520px;margin:0 auto;padding:32px 24px;` +
    `font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#33222b">` +
    `<p style="margin:0 0 24px;font-weight:700;font-size:20px;color:#a03a1e">rung.</p>` +
    body +
    `</div></body></html>`
  );
}

/*
 * RESEND yükü.
 *
 * `reply_to` YILAN_KUTUSU (snake_case). Resend'in Node SDK'sı `replyTo`
 * kabul ediyor ve belgelerdeki örnekler çoğu zaman onu gösteriyor — ama biz
 * SDK kullanmıyoruz, ham JSON gönderiyoruz. Ham gövdede `replyTo` sessizce
 * yok sayılıyor: hata yok, 200 dönüyor, cevap adresi hiç yazılmıyor.
 */
export function resendBody(mail: Mail, env: Envelope): Record<string, unknown> {
  return {
    from: `${env.fromName} <${env.from}>`,
    to: [mail.to],
    subject: mail.subject,
    text: mail.text,
    html: toHtml(mail.text),
    ...(env.replyTo ? { reply_to: env.replyTo } : {}),
  };
}

/*
 * BREVO yükü. Alan adları Resend'inkilerle KASITLI OLARAK farklı ve burada
 * eşleniyor: gönderen bir nesne (`sender`), alıcılar nesne listesi, gövdeler
 * `textContent` / `htmlContent`, cevap adresi `replyTo` nesnesi.
 */
export function brevoBody(mail: Mail, env: Envelope): Record<string, unknown> {
  return {
    sender: { name: env.fromName, email: env.from },
    to: [{ email: mail.to }],
    subject: mail.subject,
    textContent: mail.text,
    htmlContent: toHtml(mail.text),
    ...(env.replyTo ? { replyTo: { email: env.replyTo } } : {}),
  };
}
