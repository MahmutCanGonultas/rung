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

## Aşama 01 — Hesap ve oturum

*(henüz başlanmadı)*
