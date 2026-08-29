import { log } from "./log";

/*
 * E-POSTA GÖNDERİMİ — tek `fetch`, npm paketi yok.
 *
 * SAĞLAYICI GERÇEKLERİ, 29 Ağustos 2026'da kendi sayfalarından doğrulandı:
 *   Resend  3.000/ay · 100/gün · ALAN ADI ZORUNLU · Vercel Marketplace'te
 *   Brevo   300/gün · süresiz · kredi kartı istemiyor · alan adı şart değil
 *   AWS SES 21 Temmuz 2026'dan beri yeni hesaplarda ücretsiz katman YOK, ve
 *           SigV4 imzalama "tek fetch, paket yok" kuralını bozuyor
 *
 * ALAN ADI HER HÂLÜKÂRDA ŞART — ve bunu söyleyen üçüncü taraf değil, Brevo'nun
 * kendisi: "Sending from a free email address (@gmail.com, @yahoo.com,
 * @outlook.com, etc.) will cause your emails to be rejected or filtered to
 * spam." DMARC kurulmamışsa Microsoft adreslerine giden her şey spam sayılıyor.
 * Şifre sıfırlama maili tam da en çok gerektiği anda (dışarıda kaldığın an)
 * spam'e düşerse özellik yok demektir.
 *
 * ANAHTAR YOKSA PATLAMIYOR, YAZIYOR. Geliştirmede ve duman testinde bağlantı
 * sunucu günlüğüne düşüyor: akışın tamamı gerçek posta kutusu olmadan
 * sınanabiliyor. Üretimde anahtar yoksa bu bir yapılandırma hatası ve
 * `sent: false` dönüyor — çağıran taraf kullanıcıya yalan söylemesin diye.
 */


export type MailResult = { sent: boolean; reason?: string; detail?: string };

export type Mail = {
  to: string;
  subject: string;
  /** Düz metin gövde. HTML'i buradan türetiliyor — tek kaynak. */
  text: string;
};

function appUrl(): string {
  /*
   * Bağlantının tam adresi. `VERCEL_URL` dağıtım başına değişen bir adres
   * (önizleme dağıtımları) — kalıcı adres elle veriliyor, yoksa gönderilen
   * bağlantı bir sonraki dağıtımda ölürdü.
   */
  return process.env.APP_URL ?? "http://localhost:3000";
}

export function linkFor(path: string): string {
  return new URL(path, appUrl()).toString();
}

/*
 * Düz metinden HTML. Ayrı bir şablon tutulmuyor: iki gövdeyi elde ayrı ayrı
 * güncellemek, birinin eskimesi demek. Bağlantılar tıklanabilir oluyor,
 * gerisi paragraf.
 */
function toHtml(text: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const body = escape(text)
    .split(/\n{2,}/)
    .map((para) => {
      const withLinks = para.replace(
        /(https?:\/\/\S+)/g,
        '<a href="$1" style="color:#a03a1e">$1</a>'
      );
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
 * İKİ SAĞLAYICI, TEK ARAYÜZ — hangisinin anahtarı varsa o kullanılıyor.
 *
 * Resend, Vercel Marketplace'ten kurulabiliyor ve anahtarı projeye
 * kendiliğinden ortam değişkeni olarak giriyor: alan adı, DNS ve e-posta tek
 * panelden yürüyor. Brevo alan adı olmadan da gönderebiliyor ve günlük kotası
 * daha yüksek.
 *
 * Seçim burada bir `if`: ikisi de aynı üç şeyi istiyor (kime, konu, gövde) ve
 * ikisi de tek `fetch`. Sağlayıcı değiştirmek bir ortam değişkeni silmek.
 */
type Sender = {
  name: string;
  send(mail: Mail, from: string, fromName: string): Promise<MailResult>;
};

const RESEND: Sender = {
  name: "resend",
  async send(mail, from, fromName) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${from}>`,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: toHtml(mail.text),
      }),
    });
    return response.ok
      ? { sent: true }
      : {
          sent: false,
          reason: `http_${response.status}`,
          detail: await response.text().catch(() => ""),
        };
  },
};

const BREVO: Sender = {
  name: "brevo",
  async send(mail, from, fromName) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        // Brevo'nun başlığı `api-key`. `Authorization: Bearer` DEĞİL — en sık
        // yapılan hata bu ve 401 ile döner.
        "api-key": process.env.BREVO_API_KEY ?? "",
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName, email: from },
        to: [{ email: mail.to }],
        subject: mail.subject,
        textContent: mail.text,
        htmlContent: toHtml(mail.text),
      }),
    });
    return response.ok
      ? { sent: true }
      : {
          sent: false,
          reason: `http_${response.status}`,
          detail: await response.text().catch(() => ""),
        };
  },
};

function pickSender(): Sender | null {
  if (process.env.RESEND_API_KEY) return RESEND;
  if (process.env.BREVO_API_KEY) return BREVO;
  return null;
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  const sender = pickSender();
  const from = process.env.MAIL_FROM;
  const fromName = process.env.MAIL_FROM_NAME ?? "Rung";

  if (!sender || !from) {
    /*
     * Yapılandırma yok. Geliştirmede bu normal — bağlantıyı günlüğe yazıp
     * akışı sürdürüyoruz. Üretimde bu bir arıza ve öyle raporlanıyor.
     */
    if (process.env.NODE_ENV === "production") {
      log.error(
        "mail_not_configured",
        new Error("RESEND_API_KEY / BREVO_API_KEY ya da MAIL_FROM yok"),
        { to: mail.to }
      );
      return { sent: false, reason: "not_configured" };
    }
    console.log(
      `\n── E-POSTA (geliştirme, gönderilmedi) ──\nkime: ${mail.to}\nkonu: ${mail.subject}\n\n${mail.text}\n────────────────────────\n`
    );
    return { sent: true, reason: "logged" };
  }

  try {
    const result = await sender.send(mail, from, fromName);
    if (!result.sent) {
      log.error("mail_send_failed", new Error(result.reason ?? "?"), {
        provider: sender.name,
        to: mail.to,
        detail: (result.detail ?? "").slice(0, 300),
      });
    }
    return { sent: result.sent, reason: result.reason };
  } catch (error) {
    log.error("mail_send_threw", error, { provider: sender.name, to: mail.to });
    return { sent: false, reason: "network" };
  }
}
