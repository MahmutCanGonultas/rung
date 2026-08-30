/*
 * Bütün ekranların ekran görüntüsünü alır — iki tema, iki genişlik.
 *
 * Çalıştırma:  node --env-file=.env.local scripts/shots.mjs <klasör>
 *
 * Gerçek bir hesap açıp gerçek veri kuruyor: boş ekranların görüntüsü
 * tasarımın nasıl durduğunu göstermiyor. Bitince hesabı siliyor.
 *
 * `--window-size` KULLANMIYOR: macOS'ta pencere asgari genişliğe takılıyor ve
 * görüntü yanıltıcı çıkıyor. Viewport doğrudan protokol üzerinden ayarlanıyor.
 */

import puppeteer from "puppeteer-core";
import { Client } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const OUT = process.argv[2];
if (!OUT) throw new Error("çıktı klasörü gerekiyor");

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3000";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
/*
 * Sabit ve sunuma uygun bir adres: görüntülerdeki kabuk çubuğunda kullanıcının
 * e-postası görünüyor ve `shots-1787564837194@rung.test` gibi bir şey README'de
 * çirkin duruyor. Koşum başında ve sonunda siliniyor.
 */
const EMAIL = "demo@rung.app";
const PASS = "duman-testi-9182";

const SUBS = ["tense", "article", "register", "tr_pattern", "spelling", "collocation"];

/*
 * Görüntüyü almadan önce sayfayı BİTMİŞ karesine getir.
 *
 * Önce sayfa boyunca kaydırılıyor ki ekran dışındaki bölümlerin görünüm
 * gözcüsü tetiklensin, sonra her animasyon son karesine atlatılıyor. Sonsuz
 * olanlar (bekleyen düğmenin ışığı) `finish()` kabul etmiyor, atlanıyor.
 *
 * `requestAnimationFrame` KULLANILMIYOR: arka plandaki sekmede hiç ateşlenmiyor
 * ve burası sonsuza kadar bekliyordu. Aynı sebep animasyonları da donduruyordu
 * — bu yüzden artık tek sekme var (aşağı bak).
 */
async function settle(tab) {
  /*
   * 1) Hidrasyonu bekle. Bu adım atlanınca araç sessizce yanlış sonuç veriyordu:
   *    `getAnimations()` boş dönüyor, `finish()` hiçbir şey yapmıyor, sonra
   *    React yükleniyor, animasyonlar BAŞLIYOR ve görüntü tam ilk karede
   *    alınıyordu — işaretsiz hata aralıkları, boş sayılar.
   */
  await tab.waitForFunction(
    () => document.querySelector('[data-play="1"]') !== null || !document.querySelector("[data-play]"),
    { timeout: 5000 }
  ).catch(() => {});

  // 2) Sayfa boyunca kaydır ki ekran dışı bölümlerin görünüm gözcüsü tetiklensin.
  await tab.evaluate(() => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 400) window.scrollTo(0, y);
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 250));

  /*
   * 3) Her animasyonu son karesine atlat. İki tur: ilk tur sırasında yeni
   *    animasyon doğmuş olabiliyor. Sonsuz olanlar (bekleyen düğmenin ışığı)
   *    `finish()` kabul etmiyor, atlanıyor.
   *
   *    `requestAnimationFrame` kullanılmıyor — arka plandaki sekmede hiç
   *    ateşlenmiyor ve burası sonsuza kadar bekliyordu.
   */
  for (let pass = 0; pass < 2; pass += 1) {
    await tab.evaluate(() => {
      for (const a of document.getAnimations()) {
        try {
          a.finish();
        } catch {
          /* sonsuz animasyon — bitmesi diye bir şey yok */
        }
      }
    });
    await new Promise((r) => setTimeout(r, 120));
  }
}

async function seed(client) {
  // Önceki koşumdan kalmış olabilir.
  await client.query("DELETE FROM users WHERE email = $1", [EMAIL]);

  /*
   * DOĞRULANMIŞ AÇILIYOR. Gerçek kayıtlar artık bir bağlantıya tıklanarak
   * açıldığı için doğrulanmış doğuyor; doğrulanmamış hesap istisna. Burada
   * `NULL` bırakmak her ekrana bir uyarı şeridi ekliyor ve görüntüler tasarımın
   * olağan hâlini değil istisnayı gösteriyordu.
   */
  const id = (await client.query(
    "INSERT INTO users (email,password_hash,email_verified_at) VALUES ($1,$2,now()) RETURNING id::text AS id",
    [EMAIL, await bcrypt.hash(PASS, 12)]
  )).rows[0].id;

  const ctx = (await client.query("SELECT id FROM contexts LIMIT 1")).rows[0].id;
  const tasks = (await client.query(
    "SELECT id FROM tasks WHERE context_id=$1 AND level='B1' LIMIT 2", [ctx]
  )).rows;

  /*
   * ON SEKİZ KAYDIN ON SEKİZ AYRI METNİ.
   *
   * Önceden hepsine aynı gövde yazılıyordu ve liste ekranında on sekiz özdeş
   * satır çıkıyordu — tam da tasarımın çözmesi gereken sorunun kendisi, ama
   * gerçek veride değil ARACIN ürettiği veride. Kendi inceleme aracı yanlış
   * bir dünya gösterince onunla alınan karar da yanlış oluyor.
   *
   * Metinler bilerek hatalı: liste satırındaki cümle gerçekte de böyle
   * görünecek.
   */
  const BODIES = [
    "Dear Sarah, I am agree with your suggestion about the meeting of tomorrow. Thanks for the informations you sent me last week.",
    "Last weekend I have visited my friend in Ankara. The weather was very nice so we decided to walk in the park for two hours.",
    "I am writing to ask about the deposit for the flat that I rented last year. The agreement said thirty days but nothing arrived.",
    "My manager asked me to prepare a short report about the new pricing. I am not agree with some of the numbers in the document.",
    "Yesterday i went to the doctor because my back was hurting since three days. He told me that i should not sit so much time.",
    "I want to explain why i decided to change my morning habits. Before i was waking up very late and i couldnt finish my works.",
    "The neighbour asked me to look after his plants while he is away. I said yes but i dont know nothing about the plants care.",
    "We should discuss about the details of the contract when you are free. There is some points that are not clear for me still.",
    "I have bought a new laptop last month but the battery is not working good. Can you tell me how i can send it for the repair?",
    "When i was child my grandmother teached me how to make bread. I still remember the smell of the kitchen in the early morning.",
    "The train was late for one hour and i missed my connection to Izmir. Nobody in the station could gave me a clear information.",
    "I would like to apply for the position that you have announced last week. I am working in this sector since almost five years.",
    "My friend recommended me this book but i couldnt finished it. The story was interesting but there was too many characters.",
    "I am agree that we need to change the process, however i think the timing is not good because the team is very busy now.",
    "Could you please to tell me when the transfer will be made and to which account? I have send three emails without answer.",
    "The weather in Istanbul was raining all the week so we stayed at home. We watched some films and cooked a lot of foods.",
    "I decided to stop drinking coffee after lunch because i couldnt sleep. It was difficult in the first days but now is better.",
    "Thank you for your quick answer. I will send you the documents that you asked until the end of this week without fail.",
  ];
  let bodyIndex = 0;

  let firstEntry = null;
  for (let month = 5; month >= 0; month--) {
    for (let k = 0; k < 3; k++) {
      const words = 70 + k * 10;
      /* Bulgu aralıkları bu kaydın KENDİ metninden kesiliyor: ekranda
         işaretlenen parça gerçekten cümlenin içinde olsun. */
      const body = BODIES[bodyIndex++ % BODIES.length];
      const nf = Math.max(1, Math.round(8 - (5 - month)));
      const entry = (await client.query(
        `INSERT INTO entries (user_id,context_id,task_id,body,word_count,created_at)
         VALUES ($1,$2,$3,$4,$5, now() - ($6||' days')::interval) RETURNING id::text AS id`,
        [id, ctx, tasks[(month + k) % tasks.length].id, body, words, month * 30 + k * 3]
      )).rows[0].id;
      if (month === 0 && k === 2) firstEntry = entry;

      const analysis = (await client.query(
        `INSERT INTO analyses (entry_id,layer,model_id,prompt_version,status,cost_usd,duration_ms,input_tokens,output_tokens)
         VALUES ($1,'K1','claude-sonnet-5','v1','ok',0.0099,4700,1876,290) RETURNING id::text AS id`,
        [entry]
      )).rows[0].id;

      for (let i = 0; i < nf; i++) {
        await client.query(
          `INSERT INTO findings (analysis_id,entry_id,subcategory,start_offset,end_offset,
             original,suggestion,explanation,confidence,layer,verdict)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'K1',$10)`,
          [analysis, entry, SUBS[i % SUBS.length], 6 + i * 4, 6 + i * 4 + 5,
           body.slice(6 + i * 4, 6 + i * 4 + 5),
           "düzeltilmiş hâli",
           "Bu bir örnek açıklama: hatanın neden hata olduğunu tek cümlede anlatıyor.",
           0.75 + (i % 4) * 0.06,
           i === 0 ? "uncertain" : "confirmed"]
        );
      }

      await client.query(
        `INSERT INTO level_estimates (user_id,entry_id,level,score,signals,reliable,created_at)
         VALUES ($1,$2,$3,$4,$5,true, now() - ($6||' days')::interval)`,
        [id, entry, ["A2", "B1", "B1", "B1", "B2", "B2"][5 - month],
         (1.4 + (5 - month) * 0.24).toFixed(3),
         JSON.stringify([
           { name: "Kelime bandı", value: 2.1, band: "B1", detail: "Farklı kelimelerin %24'ü temel bandın dışında" },
           { name: "Cümle karmaşıklığı", value: 2.6, band: "B2", detail: "Yan cümle 0.67 · ortalama 16.2 kelime" },
           { name: "Hata yoğunluğu", value: 2.2, band: "B1", detail: "100 kelimede 4.1 bulgu" },
           { name: "Hata türü", value: 2.4, band: "B1", detail: "3 temel · 4 nüans" },
         ]), month * 30 + k * 3]
      );
    }
  }

  /*
   * Kelime defterine birkaç not: bölüm hiç not yokken çizilmiyor, o yüzden
   * tohumsuz görüntülerde tasarımı görmek mümkün değildi.
   */
  const NOTES = [
    ["reluctant", "reluctant", "C1", "She was reluctant to accept the offer.", 3],
    ["deposit", "deposit", "B2", "Ask your landlord about the deposit you have not received.", 6],
    ["landlord", "landlord", "C1", "Ask your landlord about the deposit you have not received.", 9],
    ["received", "received", "A2", '"recieved" sözlükte yok. Önerilenler: received, relieved.', 14],
  ];
  for (const [word, surface, band, snippet, days] of NOTES) {
    await client.query(
      `INSERT INTO word_notes
         (user_id, word, surface, band, source, source_entry_id, context_snippet,
          noted_at, resolved_at)
       VALUES ($1,$2,$3,$4,'entry',$5,$6, now() - ($7 || ' days')::interval, $8)`,
      [id, word, surface, band, firstEntry, snippet, days,
       word === "received" ? new Date() : null]
    );
  }

  return { id, entry: firstEntry };
}

const PAGES = [
  ["anasayfa", "/", false],
  ["giris", "/login", false],
  ["kayit", "/register", false],
  ["sifre-unuttum", "/forgot", false],
  ["yaz", "/write", true],
  ["gecmis", "/history", true],
  ["ilerleme", "/progress", true],
  ["dogruluk", "/accuracy", true],
];

async function main() {
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();
  const { entry } = await seed(client);

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
  });

  /*
   * TEK SEKME, bilerek.
   *
   * Önce ikinci bir sekme (giriş yapmamış ziyaretçi için) kullanılıyordu ve
   * sonuçlar sessizce yanlıştı: Chrome arka plandaki sekmede CSS
   * animasyonlarını ve `requestAnimationFrame`i askıya alıyor. O sekmenin
   * görüntüleri hareketin İLK karesinde donuyordu — işaretsiz hata aralıkları,
   * boş sayılar. Ürün doğruydu, ölçen araç yanlış bakıyordu. `bringToFront()`
   * çözmedi.
   *
   * Çözüm sekme sayısını bire indirmek: önce herkese açık sayfalar çerezsiz
   * çekiliyor, SONRA giriş yapılıp geri kalanlar. Tek sekme daima önde.
   */
  const page = await browser.newPage();

  const all = [...PAGES, ["kayit-detay", `/entries/${entry}`, true]];
  const problems = [];

  async function capture(list) {
    for (const dark of [false, true]) {
      /*
       * `prefers-reduced-motion: reduce` DAİMA açık.
       *
       * İki sebep, ikisi de önemli:
       *
       * 1. Bu tercih bitmiş kareyi garanti ediyor. Zamanlamayla bitmiş kareyi
       *    yakalamaya çalışmak defalarca yanlış sonuç verdi — animasyonlar
       *    hidrasyondan sonra doğuyor, arka plan sekmesinde donuyor, `finish()`
       *    henüz var olmayan animasyona işlemiyor. Tercihi açmak bu sınıfın
       *    tamamını ortadan kaldırıyor.
       *
       * 2. Asıl doğrulanması gereken durum zaten bu. Kural şu: TEMEL CSS DAİMA
       *    BİTMİŞ KARE. Bu görüntüler o kuralın tutup tutmadığının kanıtı —
       *    bir bilgi yalnızca harekete emanet edilmişse burada eksik görünür.
       *
       * Hareketin kendisi tarayıcıda gözle bakılarak kontrol ediliyor.
       */
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: dark ? "dark" : "light" },
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);

      for (const [name, path] of list) {
        for (const [w, h, tag] of [[1440, 900, "gs"], [390, 844, "mb"]]) {
          await page.setViewport({ width: w, height: h });
          await page.goto(BASE + path, { waitUntil: "networkidle0" });
          await settle(page);

          const check = await page.evaluate(() => {
            const docW = document.documentElement.clientWidth;
            const over = [...document.querySelectorAll("body *")]
              .filter((el) => el.getBoundingClientRect().right > docW + 1)
              .map((el) => `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}`);
            return {
              overflow: document.documentElement.scrollWidth > docW + 1,
              culprits: [...new Set(over)].slice(0, 3),
            };
          });
          if (check.overflow) {
            problems.push(`${name} ${tag} ${dark ? "koyu" : "acik"}: ${check.culprits.join(", ")}`);
          }

          await page.screenshot({
            path: `${OUT}/${name}-${tag}-${dark ? "koyu" : "acik"}.png`,
            fullPage: tag === "gs",
          });
        }
      }
    }
  }

  // 1) çerez yokken: anasayfa, giriş, kayıt
  await capture(all.filter(([, , authed]) => !authed));

  // 2) giriş yap, sonra kalanlar
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
  await page.type('input[name="email"]', EMAIL);
  await page.type('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 2500));

  await capture(all.filter(([, , authed]) => authed));

  await browser.close();
  await client.query("DELETE FROM users WHERE email=$1", [EMAIL]);
  await client.end();

  console.log(`${all.length} ekran × 2 tema × 2 genişlik = ${all.length * 4} görüntü`);
  console.log(problems.length ? "\nYATAY TAŞMA:\n  " + problems.join("\n  ") : "\nyatay taşma: YOK");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
