import {
  brevoBody,
  buildLink,
  resendBody,
  type Envelope,
  type Mail,
} from "./email-body";
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

export type { Mail } from "./email-body";

function appUrl(): string {
  /*
   * Bağlantının tam adresi. `VERCEL_URL` dağıtım başına değişen bir adres
   * (önizleme dağıtımları) — kalıcı adres elle veriliyor, yoksa gönderilen
   * bağlantı bir sonraki dağıtımda ölürdü.
   */
  return process.env.APP_URL ?? "http://localhost:3000";
}

export function linkFor(path: string): string {
  return buildLink(path, appUrl());
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
  send(mail: Mail, env: Envelope): Promise<MailResult>;
};

const RESEND: Sender = {
  name: "resend",
  async send(mail, env) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(resendBody(mail, env)),
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
  async send(mail, env) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        // Brevo'nun başlığı `api-key`. `Authorization: Bearer` DEĞİL — en sık
        // yapılan hata bu ve 401 ile döner.
        "api-key": process.env.BREVO_API_KEY ?? "",
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(brevoBody(mail, env)),
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
  /*
   * CEVAP ADRESİ. Gönderdiğimiz alan adının MX kaydı yok — oraya yazılan
   * cevap hiçbir yere gitmiyor. Bu değişken doluysa cevaplar gerçek bir
   * kutuya düşüyor. Boşsa alan hiç yazılmıyor.
   */
  const replyTo = process.env.MAIL_REPLY_TO || undefined;

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
    const result = await sender.send(mail, { from, fromName, replyTo });
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
