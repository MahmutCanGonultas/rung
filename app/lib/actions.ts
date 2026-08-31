"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { log } from "./log";

import { hashPassword, verifyCredentials } from "./auth";
import { db } from "./db";
import { linkFor, sendMail } from "./email";
import { checkMailbox } from "./email-check";
import type { FormState } from "./form-state";
import { createSession, destroySession } from "./session";
import { claimByCode, stashSignup, sweepPending } from "./signup";
import { allow, sweepAttempts } from "./throttle";
import {
  normalizeEmail,
  readField,
  validateEmail,
  validatePassword,
} from "./validation";

/*
 * Server Action'lar.
 *
 * `"use server"` bu dosyadaki fonksiyonları, tarayıcıdaki formun doğrudan
 * çağırabileceği sunucu uçlarına çeviriyor. Ayrı bir API rotası yazmak,
 * JSON'a çevirmek, geri okumak yok. Form JavaScript kapalıyken de çalışır.
 *
 * `redirect()` özel bir hata fırlatarak çalışıyor — bu yüzden asla try/catch
 * içinde çağrılmıyor, yoksa kendi catch'imiz yönlendirmeyi yutar.
 */

/*
 * KAYIT — hesap burada AÇILMIYOR.
 *
 * Bu form artık yalnızca bir NİYET kaydediyor: adres, şifre özeti ve yirmi
 * dört saatlik bir jeton. Hesap, o adrese giden bağlantıya tıklandığında
 * `/verify` içinde açılıyor.
 *
 * NEDEN DEĞİŞTİ: "hesabı aç, sonra doğrula" modelinde `asdasdas@outlook.com`
 * yazan biri veritabanında gerçek bir hesap olarak duruyordu — doğrulanmamış,
 * şifresi sıfırlanamaz, ama var. İstenen şey açıktı: gerçek olduğuna emin
 * olduğumuz adresler kaydolsun. Bir kutunun hem VAR OLDUĞUNUN hem de kişinin
 * ona ERİŞTİĞİNİN tek kanıtı, oraya giden bağlantıya tıklanması.
 *
 * BEDELİ, AÇIKÇA: mail teslim edilemiyorsa kimse kaydolamıyor. Bunu
 * gizlemiyoruz — `sendMail` başarısız olursa ekranda dürüst bir cümle çıkıyor
 * ve bekleyen kayıt yazılmıyor.
 *
 * REDDEDİLEN ALTERNATİF: mail gönderilemediğinde eski davranışa düşmek
 * (hesabı yine de açmak). Sessizce açılan bir arka kapı, kapının kendisinden
 * kötüdür: yapılandırma bozulduğu gün ürün ölçtüğünü sandığı şeyi ölçmemeye
 * başlar ve kimse fark etmez.
 */
export async function registerAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = normalizeEmail(readField(formData, "email"));
  const password = readField(formData, "password");

  const emailError = validateEmail(email);
  if (emailError) return { error: emailError, email };

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError, email };

  /*
   * ADRES POSTA ALABİLİYOR MU — mail atmadan yapılabilen tek kontrol.
   *
   * Yazım hatasını (@gmial.com) ve uydurma alan adını burada yakalıyoruz;
   * bunları bağlantıya bırakmak, kullanıcıyı hiç gelmeyecek bir maili
   * beklemeye göndermek olurdu. KUTUNUN kendisi buradan bilinemiyor — onu
   * bağlantı ölçüyor.
   *
   * Şifreden SONRA duruyor: DNS sorgusu ağ işi ve zayıf şifre yazan birine
   * bunu bekletmenin anlamı yok.
   */
  const mailbox = await checkMailbox(email);
  if (!mailbox.ok) {
    if (mailbox.reason === "unreachable") {
      /*
       * Sorgu cevap vermedi. Bunu SESSİZ geçmiyoruz ve artık geçirmiyoruz
       * da: elekten geçen ölü bir alan adı, hesabın maille açıldığı bu
       * modelde doğrudan bir hard bounce demek ve gönderim itibarımızı
       * yakıyor. Kod günlüğe yazılıyor ki sebebi tahmin etmeyelim.
       */
      log.error("mx_check_unreachable", new Error(mailbox.code ?? "?"), { email });
    }
    const mesaj: Record<string, string> = {
      disposable:
        "Geçici e-posta adresleri kullanılamıyor — bu ürün aylar boyunca ölçüyor ve şifreni unutursan o adrese geri dönmen gerekiyor.",
      no_mail_server:
        "Bu adresin alan adı posta almıyor. Yazımını kontrol eder misin?",
      unreachable:
        "Adresini şu an doğrulayamadık — bağlantı sorunu olabilir. Birkaç saniye sonra tekrar dener misin?",
    };
    return { error: mesaj[mailbox.reason], email };
  }

  try {
    /*
     * İKİ KOVA — `requestResetAction` ile aynı gerekçe, aynı sayılar.
     *
     * Adres kovası bir kişinin kutusunun bombalanmasını engelliyor; IP kovası
     * tek kaynaktan yüzlerce adrese mail attırılmasını. IP sınırı bilerek
     * gevşek: mobil operatörler CGNAT kullanıyor, dar bir sınır saldırganı
     * değil aynı hattaki insanları keserdi.
     *
     * Sınıra takılan istek SESSİZCE düşüyor ve ekran yine "kutuna bak" diyor.
     * "Çok denedin" demek, o adresin durumu hakkında bilgi vermenin dolaylı
     * yolu olurdu.
     */
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "";
    const okEmail = await allow({
      key: `signup:${email}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    const okIp = await allow({
      key: ip ? `signup-ip:${ip}` : "",
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!okEmail || !okIp) return { error: null, email, sent: true };

    /*
     * ADRES ZATEN KAYITLIYSA EKRAN DEĞİŞMİYOR.
     *
     * Eskiden "Bu e-posta zaten kayıtlı" yazıyordu ve bu, sırayla adres
     * deneyerek kimin üye olduğunu öğrenmeye yeten bir cevaptı. Kurtarma
     * yolunda bu sızıntıyı kapatmıştık; kayıt yolunda açık bırakmak aynı
     * listeyi başka kapıdan vermek olurdu.
     *
     * Kutuya YİNE de bir mail gidiyor, ama farklı bir mail: "hesabın zaten
     * var". Gerçekten unutmuş olan kişi böylece yardım alıyor, deneyen kişi
     * hiçbir şey öğrenmiyor — ikisi de aynı ekranı görüyor.
     */
    const existing = (await db()`
      SELECT id::text AS id FROM users WHERE email = ${email} LIMIT 1
    `) as Array<{ id: string }>;

    const mail = existing[0]
      ? {
          to: email,
          subject: "Rung — hesabın zaten var",
          text:
            `Bu adresle bir hesap açılmaya çalışıldı, ama zaten bir hesabın var.\n\n` +
            `Giriş yapmak için:\n${linkFor("/login")}\n\n` +
            `Şifreni hatırlamıyorsan:\n${linkFor("/forgot")}\n\n` +
            `Bu isteği sen yapmadıysan yapman gereken bir şey yok — ` +
            `hesabına hiçbir şey olmadı.`,
        }
      : await (async () => {
          /*
           * Şifre özeti bekleyen kayda da bcrypt'li giriyor. Geçici diye açık
           * saklamak, sızıntıda insanların BAŞKA sitelerdeki şifrelerini
           * vermek olurdu — insanlar şifre tekrar kullanıyor.
           */
          const { token, code } = await stashSignup({
            email,
            passwordHash: await hashPassword(password),
          });
          /*
           * GÖVDE BİR MEKTUP, BİR BİLDİRİM DEĞİL.
           *
           * Önceki hâli kırk kelimeydi: bir cümle, bir bağlantı, iki cümle.
           * Kim gönderiyor, mail neden geldi, hangi adres için, tıklanmazsa
           * ne olur — hiçbiri yazmıyordu. Alan adı yeni olduğu için filtrenin
           * elinde itibar sinyali yok ve karar şekle bakıyor; kırk kelimelik
           * tek bağlantılı bir mail "normal insan maili" örüntüsüne az
           * benziyor.
           *
           * İkinci ve daha önemli sebep: mail SPAM'E DÜŞTÜĞÜNDE de okunabilir
           * olmalı. Oradan çıkarılacak tek şey "bu meşru bir mail" kararıysa,
           * o kararı verecek kadar bilgi içermeli.
           *
           * KOD BAĞLANTININ YANINDA. Junk'a düşen bir mail, bağlantı tek yol
           * olduğunda ölü uçtur; kodla birlikte otuz saniyelik bir sapmaya
           * dönüyor — kişi zaten açık duran sekmeye yazıyor.
           */
          return {
            to: email,
            subject: "Rung — hesabını aç",
            text:
              `Merhaba,\n\n` +
              `rungscale.com adresinde ${email} ile bir hesap açılmak istendi. ` +
              `Rung, Türkçe konuşanlar için bir İngilizce ölçüm aleti — yazdığın ` +
              `İngilizceye bakıp hatayı sabit bir taksonomiye yazıyor ve aylar ` +
              `boyunca izliyor.\n\n` +
              `Hesabın şu bağlantıya tıklayınca açılıyor:\n\n` +
              `${linkFor(`/verify?t=${token}`)}\n\n` +
              `Bağlantı çalışmazsa ya da bu maile başka bir cihazdan bakıyorsan, ` +
              `kayıt ekranında duran kutuya şu kodu yazabilirsin:\n\n` +
              `${code}\n\n` +
              `İkisi de aynı yere çıkıyor ve yirmi dört saat geçerli.\n\n` +
              `Tıklamazsan hiçbir şey olmuyor: şu an ortada bir hesap YOK, ` +
              `yalnızca bekleyen bir kayıt var ve yirmi dört saat sonra kendi ` +
              `kendine siliniyor. Bu isteği sen yapmadıysan bu maili silmen ` +
              `yeterli — kimse adresinle bir hesap açmış olmuyor.\n\n` +
              `Bu maile cevap yazabilirsin, okuyoruz.`,
          };
        })();

    const result = await sendMail(mail);
    if (!result.sent) {
      /*
       * MAİL GİTMEDİ. Bekleyen kayıt yazılmış olabilir ama kimse ona
       * ulaşamaz; süresi dolunca kendi kendine düşüyor. Kullanıcıya
       * söylediğimiz şey doğru olan: şu an kaydolamazsın.
       */
      return {
        error:
          "Doğrulama e-postası gönderilemedi, o yüzden kaydını tamamlayamıyoruz. " +
          "Biraz sonra tekrar dener misin?",
        email,
      };
    }

    /* Eski damgalar ve tıklanmadan kalmış bekleyen kayıtlar toplansın:
       ikincisinin içinde bir şifre özeti duruyor. */
    void sweepAttempts();
    void sweepPending();
  } catch (error) {
    return { error: reportUnexpected("kayıt", error), email };
  }

  return { error: null, email, sent: true };
}

/*
 * KODLA HESABI AÇ — mail spam'e düştüğünde kullanılan ikinci yol.
 *
 * Bağlantıyla tamamen aynı yere varıyor: aynı bekleyen kayıt, aynı hesap,
 * aynı oturum. Fark yalnızca kanıtın nasıl gösterildiği.
 *
 * NEDEN VAR: gönderim alan adı yeni ve Outlook maili gereksiz klasörüne
 * koydu — ölçüldü. İtibar zamanla oluşuyor ve satın alınamıyor; o süre
 * boyunca bağlantı tek yol olsaydı ürün çalışmıyor olurdu.
 */
export async function verifySignupCodeAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = normalizeEmail(readField(formData, "email"));
  /* Boşluk ve tire yazan çok oluyor ("391 402", "391-402") — temizleyip alıyoruz. */
  const code = readField(formData, "code").replace(/\D/g, "");

  if (code.length !== 6) {
    return { error: "Kod altı haneli. Maildeki sayıyı olduğu gibi yaz.", email, sent: true };
  }

  let userId: string;
  try {
    /*
     * İKİ KOVA. Kod altı hane, yani bir milyon olasılık — sınırsız denemede
     * hiçbir şey. Bekleyen kaydın kendi beş deneme hakkı var (`claimByCode`),
     * bu kovalar da aynı adrese ve aynı kaynağa yeni kayıtlar açtırıp
     * durmadan yeni kod üretmeyi engelliyor.
     */
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "";
    const okEmail = await allow({ key: `code:${email}`, limit: 10, windowMs: 60 * 60 * 1000 });
    const okIp = await allow({
      key: ip ? `code-ip:${ip}` : "",
      limit: 60,
      windowMs: 60 * 60 * 1000,
    });
    if (!okEmail || !okIp) {
      return {
        error: "Çok fazla deneme oldu. Biraz sonra tekrar dener misin?",
        email,
        sent: true,
      };
    }

    const result = await claimByCode(email, code);
    if (!result.ok) {
      /*
       * "Bu adresin bekleyen kaydı yok" ile "kod yanlış" AYNI cevabı alıyor.
       * Ayırmak, sırayla adres deneyerek kimin kaydolmaya çalıştığını
       * öğrenmeye yeterdi.
       */
      const mesaj: Record<string, string> = {
        wrong_code:
          result.left !== undefined
            ? `Kod tutmadı. ${result.left} hakkın kaldı.`
            : "Kod tutmadı.",
        unknown: "Kod tutmadı.",
        burned:
          "Çok fazla yanlış deneme oldu ve kayıt düştü. Baştan kaydolman gerekiyor.",
        expired:
          "Kodun süresi dolmuştu — yirmi dört saat geçerliydi. Baştan kaydolabilirsin.",
        email_taken:
          "Bu adresle zaten bir hesap var. Giriş yapmayı dene.",
      };
      return { error: mesaj[result.reason] ?? "Kod tutmadı.", email, sent: true };
    }

    userId = result.userId;
    await createSession(userId);
  } catch (error) {
    return { error: reportUnexpected("kod doğrulama", error), email, sent: true };
  }

  /* `redirect()` özel bir hata fırlatıyor — asla try/catch içinde çağrılmıyor. */
  redirect("/write?dogrulama=hesap");
}

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = normalizeEmail(readField(formData, "email"));
  const password = readField(formData, "password");

  if (email.length === 0 || password.length === 0) {
    return { error: "E-posta ve şifre gerekli.", email };
  }

  /*
   * Giriş yolunda da uzunluk sınırı var. Kayıt yolundaki `validateEmail` /
   * `validatePassword` burada çalışmıyor — kurallar zamanla sıkılaşabilir ve
   * eski hesaplar kilitlenmemeli. Ama saçma uzunlukta bir girdi için bcrypt
   * çalıştırmanın da anlamı yok: sadece boyuta bakıp erken dönüyoruz.
   */
  if (email.length > 254 || password.length > 400) {
    return { error: "E-posta veya şifre hatalı.", email: "" };
  }

  let userId: string;
  try {
    const verified = await verifyCredentials(email, password);
    if (!verified.ok) {
      /*
       * Tek ve aynı mesaj. "Böyle bir kullanıcı yok" ile "şifre yanlış" ayrı
       * yazılırsa, hangi e-postaların kayıtlı olduğu tek tek öğrenilebilir.
       */
      return { error: "E-posta veya şifre hatalı.", email };
    }
    userId = verified.userId;
    await createSession(userId);
  } catch (error) {
    return { error: reportUnexpected("giriş", error), email };
  }

  redirect("/write");
}

export async function logoutAction(): Promise<void> {
  try {
    await destroySession();
  } catch (error) {
    // Çerez `destroySession` içinde en başta düşüyor; buraya gelmişsek
    // tarayıcı tarafı zaten temiz, sadece satır silinememiş olabilir.
    log.error("logout_db_failed", error);
  }

  redirect("/");
}

/*
 * Beklenmeyen hatanın kullanıcıya dönen yüzü.
 *
 * Sunucu günlüğüne tam hata, ekrana sabit bir cümle. Hata metnini olduğu gibi
 * göstermek tablo adlarını, sürücü sürümünü, bazen bağlantı bilgisini sızdırır.
 */
function reportUnexpected(where: string, error: unknown): string {
  log.error("action_failed", error, { where });
  return "Beklenmeyen bir hata oldu. Biraz sonra tekrar dener misin?";
}
