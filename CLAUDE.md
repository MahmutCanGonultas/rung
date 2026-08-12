# Rung — bu projede nasıl çalışıyoruz

> Bu dosya bu klasörde açılan her Claude oturumunda otomatik okunur.
> Buradaki kurallar teknik kararlardan önce gelir. Çelişki olursa bu dosya kazanır.

## Proje nedir

Rung, Türkçe konuşanlar için bir **İngilizce ölçüm aleti** — kurs değil, sohbet botu değil, yazım
denetleyicisi değil. Kullanıcının yazdığı İngilizceye bakıp hatayı sabit bir taksonomiye yazar,
aylar boyunca izler, ve **kendi doğruluğunu ölçer**.

Ürün önizlemesi: [`design/product.html`](design/product.html) — beş ekran (Yaz · Analiz · Geçmiş · İlerleme · Doğruluk), çalışan sekmeler, koyu/açık tema.
Plan: [`docs/plan.md`](docs/plan.md) (yazılı, karar günlüğü dâhil) · [`design/roadmap.html`](design/roadmap.html) (görsel, adım adım).

## EN ÖNEMLİ KURAL — kodu Claude yazmaz

**Kavramı Claude anlatır, kodu kullanıcı yazar.**

Ne yazılacağı söylenir; satırı kullanıcı kurar, hatayı kullanıcı alır, hatayı beraber okuruz.
Claude'un kod yazması bu projede kural ihlalidir — kullanıcı açıkça "sen yaz" demedikçe.

Sebebi: proje iki hedefli — çalışan bir ürün *ve* işe alınabilir bir geliştirici. Kodu Claude yazarsa
kullanıcı sadece izler. İzleyerek öğrenilmiyor, çünkü takılan o olmuyor.

İstisna: tasarım maketleri, tek seferlik yardımcı script'ler, ve kullanıcının açıkça istediği şeyler.

## Kullanıcının seviyesi

**Hiçbir teknolojiyi bilmediğini varsay.** Terminal, git, npm, TypeScript, React, Next.js, SQL,
PostgreSQL, ortam değişkeni, deploy, dil modeli API'si, eval — hepsi sıfırdan anlatılacak.

HTML, CSS ve temel JavaScript yazabiliyor; benzetmeleri oraya bağlamak işe yarar. Ama bu bile
"bunu bilirsin" demek için gerekçe değil.

## Kurallar

| | |
|---|---|
| **Tempo** | Tek adım, sonra dur. Kullanıcı "tamam" demeden sonraki adıma geçilmez. Mesaj başına **tek dosya veya tek komut**. |
| **Kavram sırası** | Önce problem ("şu sıkıntı var, bunun için X icat edilmiş") → benzetme → projedeki yeri → kod → kontrol sorusu. |
| **Dil** | Anlatım **Türkçe**. Kod, dosya adı, tablo adı, değişken adı, commit mesajı, dal adı **İngilizce** — istisnasız. |
| **Terim** | Bir terim ilk geçtiğinde tanımlanır. "Bunu zaten biliyorsundur" cümlesi kurulmaz. |
| **Hata** | Hata mesajı görülünce doğrudan düzeltmeye geçilmez. Önce: hangi satır, hangi tür, ne bekliyordu, ne buldu. |
| **Git** | Her iş biriminde commit — aşama sonu beklenmez. Conventional Commits, İngilizce. `main` daima çalışır durumda. |
| **Hız** | Yavaş git. Bir anda çok satır verme. Kullanıcı "anlamadım" derse geri dön. |

## Kilitli kararlar

- **İsim: Rung.** Repo, klasör, veritabanı, commit'ler hep bu. Değişmez.
- **Koyu + açık tema.** Koyu varsayılan, açık tema ek. Her iki paletin de renk körlüğü ve
  kontrast açısından ayrıca doğrulanması gerekiyor — göz kararı renk seçilmez.
- **Veritabanı: Neon (bulut PostgreSQL).** Tek veritabanı; yerel kurulum yok. Dev/prod ayrımı gerektiğinde Neon dallanması.
- **Kalan teknoloji kararları kilitli değil.** `docs/plan.md` §10'daki liste öneridir. Her seçim sırası
  geldiğinde dört soruyla açılır ve **kararı kullanıcı verir**: bu ne yapıyor · onsuz ne olurdu ·
  alternatifi neydi · neden bu.

## Hâlâ açık

- Yurtdışı hedefi ne (uzaktan çalışma / taşınma / eğitim) — hedef seviyeyi ve IELTS gereğini belirliyor.
- Haftalık gerçek çalışma saati — plan aynı kalır, takvim değişir.
- Başlangıç İngilizce seviyesi — ilk hafta birkaç kayıtla **ölçülecek**, tahmin edilmeyecek.

Hiçbiri Aşama 0'ı bloke etmiyor.

## Durum

**12 Ağustos 2026 · Aşama 00 — 14 / 21 adım tamam.**

> Tasarım sayfaları **kendi kendine yeter**: CSS ve JS her HTML'in içinde gömülü, paylaşılan dosya yok.
> Bu yüzden bir renk/tipografi değişikliğinde **üç dosyanın üçü de** güncellenir:
> `design/product.html`, `design/roadmap.html`, `design/lesson/stage-00.html`.

Yapılanlar: git deposu kuruldu (`main` dalı), GitHub'a bağlandı ve push edildi, `.gitignore` yazıldı,
üç commit atıldı, Node/npm doğrulandı, `npm init` ile `package.json` oluşturuldu,
`next` + `react` + `react-dom` kuruldu.

### SIRADAKİ ADIM — Aşama 00 · Adım 15: TypeScript

```bash
npm install -D typescript @types/react @types/node
```

Anlatılacaklar: TypeScript nedir (JavaScript + tip katmanı, yeni dil değil) · `@types/*` paketleri
neden ayrı (React düz JS ile yazılmış, tipleri DefinitelyTyped'dan geliyor) · `-D` bayrağı ve
`devDependencies` — ölçüt: *canlıdaki sunucu buna ihtiyaç duyuyor mu?* Sunucuya derlenmiş JS gidiyor,
TypeScript derleyicisi orada yok.

Kontrol sorusu hazır: *`react` neden `dependencies`'te ama `@types/react` `devDependencies`'te?*

### Aşama 00'da kalanlar

15 TypeScript · 16 `app/layout.tsx` (App Router, kök şablon) · 17 `app/page.tsx` (JSX) ·
18 `npm run dev` (betik, localhost) · 19 `tsconfig.json` + katı mod · 20 `.env.local` + Neon
bağlantısı · 21 Vercel ile ilk yayın.

### Ders notları

Her aşamanın notu `design/lesson/` altında, aynı kalıpta: hızlı bakış komut kartı → adım adım
kavramlar → tuzaklar tek listede → sözlük. Aşama 00: [`design/lesson/stage-00.html`](design/lesson/stage-00.html).
**Her adımdan sonra `design/roadmap.html` içindeki ilerleme işaretleri güncellenir.**
