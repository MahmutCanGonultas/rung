import { resolveMx } from "node:dns/promises";

/*
 * ADRESİN GERÇEK OLUP OLMADIĞI — mail atmadan yapılabilenler.
 *
 * NE YAKALANABİLİR, NE YAKALANAMAZ:
 *
 *   yakalanır    @gmial.com, @outlok.com, @hotmial.com — yazım hatası
 *                @uydurdum.com — hiç var olmayan alan adı
 *                @mailinator.com — tek kullanımlık adres
 *
 *   YAKALANAMAZ  asdajda@outlook.com — alan adı gerçek, KUTU sahte
 *
 * İkincisi için tek yol var: oraya bir bağlantı yollamak ve tıklatmak. Gmail,
 * Outlook ve Yandex sunucuya "böyle bir kullanıcı yok" DEMİYOR — spam
 * toplayıcılara adres listesi çıkarttırmamak için her adresi kabul ediyormuş
 * gibi cevap veriyorlar (catch-all). Yani SMTP'den sorup öğrenmek mümkün değil;
 * denemek hem yanlış cevap verir hem sunucunun adresini kara listeye düşürür.
 *
 * Burası o yüzden bir ELEK, kanıt değil: ucuz olanı ucuza yakalıyor, gerisini
 * doğrulama bağlantısına bırakıyor.
 */

/*
 * Tek kullanımlık adres servisleri. Liste bilerek KISA: eksiksiz olması imkânsız
 * (her hafta yenisi çıkıyor) ve uzun bir liste bakımı kimsenin yapmadığı bir yük
 * oluyor. Buradakiler en yaygın olanlar; gerisini doğrulama bağlantısı ve
 * "şifreni unutursan geri dönemezsin" uyarısı hâlleder.
 *
 * NEDEN ELENİYORLAR: bu adresler dakikalar içinde ölüyor. Doğrulama mailini
 * alabilirler ama altı ay sonra şifresini unutan kişi geri dönemez — ürünün
 * vaadi zaten "aylar boyunca izlemek".
 */
const DISPOSABLE = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "getnada.com",
  "dispostable.com",
  "trashmail.com",
  "fakeinbox.com",
  "maildrop.cc",
  "mohmal.com",
  "emailondeck.com",
  "spamgourmet.com",
  "mailnesia.com",
  "tempr.email",
  "moakt.com",
  "harakirimail.com",
  "inboxkitten.com",
  "burnermail.io",
  "mailcatch.com",
]);

/*
 * Aynı alan adı defalarca sorulmasın: bir kayıt dalgasında herkes gmail.com
 * yazıyor. Süre kısa — bir alan adı posta almayı bırakabilir.
 */
/*
 * RFC 6761 ile AYRILMIŞ uzantılar. Bunlar kimseye satılamaz, hiçbir zaman
 * posta alamaz ve gerçek bir kullanıcı asla yazmaz — sorgulamanın anlamı yok,
 * DNS'e gitmeden geçiriliyor.
 *
 * NEDEN GEÇİRİLİYOR, ELENMİYOR: duman testi kendi hesaplarını `@rung.test`
 * ile açıyor ve bu takım canlıya karşı da koşabiliyor. Elenselerdi, gerçek
 * kullanıcıyı koruyan bir kural kendi test takımımızı kesiyor olurdu.
 *
 * Bunu bir açık kapı yapmıyor: `@x.test` ile açılan hesap doğrulanamıyor,
 * şifresi sıfırlanamıyor ve kabukta uyarı şeridi hiç kapanmıyor. Eleğin işi
 * GERÇEK sağlayıcıların yazım hatasını yakalamak — `.test` o değil.
 */
const RESERVED = new Set(["test", "invalid", "example", "localhost"]);

const CACHE_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { ok: boolean; at: number }>();

export type MailboxCheck =
  /*
   * `degraded`: sorgu patladığı için GEÇİRİLDİ, doğrulandığı için değil.
   * Günlüğü bu modül tutmuyor — `log` dosyası `server-only` işaretli ve onu
   * import eden her şey birim testinde patlıyor. Sinyal çağırana veriliyor,
   * o zaten sunucuda çalışıyor.
   */
  | { ok: true; degraded?: true }
  | { ok: false; reason: "disposable" | "no_mail_server" };

/*
 * Alan adı posta ALABİLİYOR MU — YALNIZCA MX'e bakıyor.
 *
 * RFC 5321 "MX yoksa A kaydına düş" diyor ve ilk sürüm öyle yazılmıştı. ÖLÇÜLDÜ
 * ve YANLIŞ ÇIKTI, iki ayrı sebeple:
 *
 *   1. YAZIM HATALARININ A KAYDI VAR. `gmial.com`, `outlok.com`, `hotmial.com`
 *      — üçü de gerçekten kayıtlı, üçünün de A kaydı var, üçünün de MX kaydı
 *      YOK. Bunlar tam olarak yakalamak istediğimiz şey: birinin adresini
 *      yanlış yazması. A kaydına düşen bir kontrol üçünü de geçiriyordu.
 *
 *   2. ÇÖZÜMLEYİCİLER YALAN SÖYLÜYOR. Geliştirme makinesinin modemi
 *      (192.168.1.1) olmayan HER alan adına kendi IP'sini döndürüyor —
 *      `uydurdumbunu12345.com` ve hatta `rung.test` bile "var" çıkıyordu. Bu
 *      Türkiye'de yaygın bir modem/operatör davranışı ve A kaydına dayanan
 *      hiçbir kontrolü ayakta bırakmıyor.
 *
 * 2026'da posta alan her gerçek alan adı MX yayımlıyor. A'sı olup MX'i olmayan
 * alan adları ezici çoğunlukla park edilmiş ya da kapılmış adlar.
 *
 * NULL MX (RFC 7505): `MX 0 .` bir alan adının "buraya posta göndermeyin"
 * demesinin resmî yolu — o da ret.
 */
/** Sınanabilmesi için dışarıdan verilebiliyor; üretimde Node'un kendi sorgusu. */
export type MxLookup = (domain: string) => Promise<Array<{ exchange: string }>>;

async function acceptsMail(domain: string, lookup: MxLookup): Promise<boolean> {
  const mx = await lookup(domain);
  if (mx.length === 0) return false;
  const nullMx = mx.length === 1 && (mx[0].exchange === "" || mx[0].exchange === ".");
  return !nullMx;
}

export async function checkMailbox(
  email: string,
  lookup: MxLookup = resolveMx
): Promise<MailboxCheck> {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (!domain) return { ok: false, reason: "no_mail_server" };

  if (DISPOSABLE.has(domain)) return { ok: false, reason: "disposable" };
  if (RESERVED.has(domain.split(".").pop() ?? "")) return { ok: true };

  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return hit.ok ? { ok: true } : { ok: false, reason: "no_mail_server" };
  }

  try {
    const ok = await acceptsMail(domain, lookup);
    cache.set(domain, { ok, at: Date.now() });
    return ok ? { ok: true } : { ok: false, reason: "no_mail_server" };
  } catch (error) {
    /*
     * "ALAN ADI YOK" ile "SORGU PATLADI" AYRI ŞEYLER.
     *
     * NXDOMAIN (alan adı hiç yok) ve NODATA (var ama MX'i yok) gerçek
     * cevaplar — ret sebebi. Zaman aşımı, bağlantı hatası ya da çözümleyicinin
     * kendi arızası ise GEÇİRİYOR: ağ hıçkırığı yüzünden gerçek bir kullanıcıyı
     * kayıttan çevirmek, sahte bir adresi içeri almaktan pahalı. Zaten
     * arkasında doğrulama bağlantısı var.
     */
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      cache.set(domain, { ok: false, at: Date.now() });
      return { ok: false, reason: "no_mail_server" };
    }
    return { ok: true, degraded: true };
  }
}
