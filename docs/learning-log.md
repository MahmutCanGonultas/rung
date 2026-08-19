# Öğrenme günlüğü

> Bu dosya kodu değil, **öğrenmeyi** kaydeder: hangi kavram ilk seferde oturmadı,
> hangi anlatım tuttu, nerede hızlanıldı. Projeyi devralan herkes — yeni bir oturum da dâhil —
> aynı duvara ikinci kez toslamasın diye.
>
> Her aşama sonunda güncellenir. Kural: **övgü yok, tespit var.**

---

## Aşama 00 — İskelet ve ilk yayın · 12–14 Ağustos 2026

### İlk seferde oturmayanlar

**`git add` — sahneleme alanı.** En büyük kavram yanılgısı buradaydı.
Kafadaki model: *"add bir işaret koyuyor, commit deyince o anki hâli alınır"* — yani **rezervasyon**.
Doğrusu: add, dosyanın o andaki **içeriğinin kopyasını** alıyor. Sonradan düzenlersen commit'e girmez.
**Tutan anlatım:** fotoğraf tepsisi benzetmesi — *"add'den sonra gömleğini değiştirsen tepsideki fotoğrafta hâlâ eski gömlek var."*

**`layout.tsx` ve `page.tsx`.** En zorlandığı yer. **Üç ayrı anlatım gerekti.**
1. Teknik anlatım (App Router, kabuk/içerik) → tutmadı
2. Kütüphane/çerçeve, "kim kimi çağırır" → kısmen
3. **Tutan:** *"her sitede iki tür parça var — tekrar eden ve o sayfaya özel"* + Rung'ın beş sekmesinin klasör ağacı
Ders: **soyut tanım değil, somut klasör yapısı işe yaradı.**

**"Neden import etmeden çalışıyor?"** — kendi sorduğu ve kilidi açan soru.
Klasik React'ta `import` + `render()` **kendisi** yazıyordu. Cevap: o kod hâlâ var, `.next/` içinde,
ve onu **Next.js üretti**. "Gelenek, yapılandırmadan üstündür."
Bu soru gelene kadar App Router gerçekten oturmamıştı.

**`children`.** İki `{ }` yan yana olduğu için karıştı:
`{ children }` (JavaScript, destructuring) ve `: { children: ReactNode }` (TypeScript, tip).
**Tutan anlatım:** ikisini alt alta çizip *"sağdakini silersen kod yine çalışır"* demek.

**`metadata`.** "HTML meta etiketi olarak mı alıyor?" diye sordu — evet, ama asıl mesele **isim**:
Next.js `metadata` adını arıyor. Buradan "hangi isim zorunlu, hangisi serbest" sorusu çıktı ve
tek kurala indi: **`export default` → isim serbest · `export const X` → isim zorunlu.**

**`git push -u`.** "Artık main dalındayım, `git push` yeter" dedi — sonuç doğru, gerekçe eksikti.
Dalda olmak *hangi* dalı söyler; `-u` *nereye* göndereceğini söyler. Dal başına bir kez.

**Ortam değişkeninde tip.** Bağlantı dizesini yazarken `: string` gerekir sandı — gerekmiyor,
TypeScript çıkarım yapıyor. Ama sezgi **bir adım erkendi**: asıl tip meselesi
`process.env.X` okurken çıktı (`string | undefined`), ve katı mod orada devreye girdi.

### İlk seferde oturanlar

- Sürüm kontrolünün **neden** gerektiği — `style-son-GERCEK.css` örneği anında tuttu
- Git'in **dağıtık** olması: "GitHub silinse projem gider mi" → *"hayır, bilgisayarımda duruyor"*
- **Neden sunucu şart**: tarayıcıya giden her şeyin okunabilir olması
- `dependencies` / `devDependencies` ayrımını **kendisi tarif etti**
- `.gitignore`'un neden depoya girdiği — üstüne *"yeni bilgisayara taşırken referans olur"* dedi,
  ki bu **`.env.example` geleneğinin doğuş sebebi.** Kendi buldu.
- **Server Components** — `console.log` deneyiyle tek seferde oturdu

### İşe yarayan yöntemler

| Yöntem | Örnek |
|---|---|
| **Deney yaptırmak** | *"`console.log` koy, hangi konsolda çıkıyor?"* — tek hamlede Server Components |
| **Önce/sonra göstermek** | İki dosya → tek HTML çıktısı |
| **"Olmasaydı ne olurdu" tablosu** | `typescript` / `@types/react` / `@types/node` eksik olsa ne patlar |
| **Gerçek hata mesajını beraber okumak** | Dört soru: hangi satır · hangi tür · ne bekliyordu · ne buldu |
| **Somut benzetme** | fotoğraf tepsisi · alışveriş listesi–fiş–poşet · resim çerçevesi |

### İşe yaramayan yöntemler

**Tek mesaja çok kavram sıkıştırmak.** Veritabanı adımında bir mesajda sekiz kavram vardı
(Server Component, async, process.env, katı mod, `!`, etiketli şablon, sürücü, SQL).
Sonuç: *"bu adımda bir şey yapmadım ve anlamadım hiç."* — **tam durma.**
Çözüm: geri sarıp tek satırlık bir deneyle baştan başlamak.

**Rutin komutları toplu vermek.** Bir mesajda dosya düzenlemesi + iki commit + push = altı hareket.
Kullanıcının uyarısı: *"hızı bir tık artırdın gibi hissediyorum, bunu yapma, ben pes ederim."*
Kavram yükü düşük olması işe yaramıyor — **hareket sayısı da yoruyor.**

### Yakalanan gerçek hatalar

Beşi de gerçekten yaşandı, hepsi ders notunda tuzak olarak kayıtlı:

1. `"type": "commonjs"` → Turbopack modül biçimi hatası *(bu benim yanlış tavsiyemdi)*
2. Commit'leyip push etmemek → Vercel eski sürümü servis ediyor (`ahead 2`)
3. Vercel paneline **tırnaklı** değer yapıştırmak → `password authentication failed`
4. JSX içinde `//` → yorum sayfada göründü
5. Sayfanın sessizce statik kalması → veri dondu, `force-dynamic` gerekti

**Kullanıcı beşini de hata mesajını okuyarak çözdü, tahminle değil.** En güçlü tarafı bu.

---

## Aşama 01 — Hesap ve oturum · 16 Ağustos 2026'da başladı

*(sürüyor — 3 / 8)*

### İlk seferde oturanlar

- **authentication / authorization ayrımı.** Turnike + asansör benzetmesi tek seferde tuttu.
  Adres çubuğunda `42` → `43` senaryosunu doğru teşhis etti ve gerekçesini kendi kurdu.
- **unique constraint neden kodda değil veritabanında olmalı.** İpucu verildi ("aynı anda
  birden fazla istek"), gerisini kendi çıkardı. Zamanlama fikrini yakaladı.
- **Silinen veri migration ile geri gelmez.** Tek cümlede doğru.

### İlk seferde oturmayanlar

**`await` var ama `async` yok.** Kendi fark etti, iki mesaj boyunca oturmadı.
Tutmayan anlatım: "top-level await diye bir ekleme geldi, modüllerde çalışıyor" — *ne olduğunu*
söylüyor, *neden gerekmediğini* söylemiyor. Kullanıcının kafasındaki soru "async **nerede**"ydi,
yani bir yerde olması gerektiğini varsayıyordu.
**Tutan anlatım:** "hiçbir yerde, çünkü yazılacak yer yok — `async` fonksiyonun önüne yazılan bir
işaret, dosyanın önü diye bir yer yok." Ardından `async`'in gerçek işi: **çağırana** "sana ürün değil
kargo takip numarası vereceğim" ilanı. Dosyayı çağıran ve ondan değer bekleyen kimse olmadığı için
ilan edilecek bir şey yok.
Ders: "bu özellik var" demek yetmiyor; **eski kuralın neden var olduğunu** söylemeden yeni kural
havada kalıyor.

**migration çalıştırıcısının mekanizması.** "Dört adım" listesi (not defteri oluştur → oku →
klasörü sırala → farkı çalıştır) tek başına tutmadı. Kullanıcının sorusu *"tamam da nasıl
yapacağım"* oldu — yani **kavram anlaşıldı, mekanizma anlaşılmadı.** İki soru ayrı şeyler.

### İşe yaramayan yöntemler — tekrar aynı hata

**Gereksiz makine kurmak.** Çalıştırıcıyı en baştan tam hâliyle tasarladım: `schema_migrations`
tablosu, `Set` ile karşılaştırma, `readdir` + `sort`, `Client`'a sürücü değişikliği. Kullanıcı:
*"şıraları en baştan alalım daha açık ol… yine gaza bastın."*
**Kök sebep:** çözümü, problemi hissettirmeden önce sundum. İkinci migration yokken not defterine
ihtiyaç yok; `Client`'a geçmeye tek komutta hiç gerek yok. Plan kuralı "önce problem, sonra çözüm"
diyor — burada tersini yaptım.
**Düzeltme:** yedi satırlık tek dosyaya indirdim (`readFile` + `neon()` + `sql.query`), sadece
**iki** yeni kavram kaldı. Ondan sonra ilerledi. Not defteri ve transaction, gerçekten gerektiğinde
eklenecek — ve o zaman gerekçesi kendiliğinden ortaya çıkacak.

**Ders notlarını/roadmap'i güncellemeyi atlamak.** Üç adım boyunca `roadmap.html` güncellenmedi;
kullanıcı hatırlattı (*"roadmap ve diğer şeyleri neden güncellemiyorsun"*). Kural CLAUDE.md'de yazılı
ama uygulanmadı. **Her adım sonunda roadmap + CLAUDE.md durumu, istisnasız.**

### Tempo — 18 Ağustos'ta iki kez daha uyarı geldi

**1 · Ders ortasında paralel iş yapmak.** Kullanıcı `product.html`'in güncellenmesini istemişti, ben
bunu öğrenme hattının **ortasında** yaptım ve üstüne uzun uzun anlattım. Sonuç: *"biz ne yaptık ki
bunları yazdın, ben hiçbir şey anlamadım, başka bir şey yapıyorduk."*
**Kural:** kullanıcının katılmadığı işler (maket, belge, ekran görüntüsü kontrolü) ya sessizce
yapılır ve **tek cümleyle** rapor edilir, ya da ders bittikten sonra yapılır. Ders hattı bölünmez.

**2 · Dosyayı tek parça vermek.** Kayıt formunun tamamını (form + iki input + öznitelikler + JSX
kuralları) tek mesajda verdim. Kullanıcı durdurdu: *"her dosyayı daha açık ve daha net anlatacaksın,
yavaş yavaş gidecez dedik."*
**Kural:** bir adım "bir dosya" değil. Dosya da bölünür — önce boş sayfa çalışsın, sonra tek alan,
sonra öznitelikler. Adım 5 bu yüzden 5a–5e diye beşe bölündü ve **5a'da tek dosya, dört satır** var.

### Kullanıcının kendi getirdiği sorular — hepsi seviye üstü

Bunlar sorulmadı, **kullanıcı sordu**; ikisi de mimari seviyesinde:

1. *"`neon(...)` satırında sql bağlantısı mı açılıyor, kim açıyor kapıları?"* → `neon(url)` ağa hiç
   dokunmuyor, sadece adresi hatırlayan bir fonksiyon üretiyor. Bağlantı `sql.query()`'de kuruluyor
   ve klasik TCP/5432 değil, HTTPS/443 + Neon tarafında bir gateway.
2. *"5-6 kullanıcı olsa bağlantı açık kalması gerekmez mi?"* → connection pool'u kendi kendine
   buldu. Cevap: havuz var ama bizim tarafta değil, Neon'un geçidinde; serverless'te kod istekler
   arasında yaşamadığı için havuzu tutacak sürekli bir program yok.

Buradan çıkan yöntem, kullanıcıya ad koyarak verildi — **her yeni kütüphaneye dört soru:**
hangi problemi çözüyor (olmasaydı ne olurdu) · bu satır ne zaman çalışıyor · bu iş nerede oluyor ·
sınırı ne. Kullanıcı bunları zaten soruyordu; adı konulunca bilerek tekrarlanabilir hâle geldi.
