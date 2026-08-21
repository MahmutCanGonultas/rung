# Rung — bu projede nasıl çalışıyoruz

> Bu dosya bu klasörde açılan her Claude oturumunda otomatik okunur.
> Buradaki kurallar teknik kararlardan önce gelir. Çelişki olursa bu dosya kazanır.

## Proje nedir

Rung, Türkçe konuşanlar için bir **İngilizce ölçüm aleti** — kurs değil, sohbet botu değil, yazım
denetleyicisi değil. Kullanıcının yazdığı İngilizceye bakıp hatayı sabit bir taksonomiye yazar,
aylar boyunca izler, ve **kendi doğruluğunu ölçer**.

Ürün önizlemesi: [`docs/design/product.html`](docs/design/product.html) — beş ekran (Yaz · Analiz · Geçmiş · İlerleme · Doğruluk), çalışan sekmeler, koyu/açık tema.
Plan: [`docs/plan.md`](docs/plan.md) (yazılı, karar günlüğü dâhil) · [`docs/design/roadmap.html`](docs/design/roadmap.html) (görsel, adım adım).

## EN ÖNEMLİ KURAL — 21 Ağustos 2026'da DEĞİŞTİ

**Kodu artık Claude yazıyor.** Kullanıcı kararı:
*"Bu projeyi sen bitir, ben ilerde başka bir Next.js projesi yapacağım. Full özenle bitir.
Benim yapmam gereken kısımlara gelince haber ver."*

### Bunun pratik anlamı

| | |
|---|---|
| **Kod** | Claude yazar, çalıştırır, doğrular, commit'ler. Onay beklemez. |
| **Tempo** | Adım adım anlatım **bitti**. Aşama aşama teslim edilir, sonunda ne yapıldığı özetlenir. |
| **Kullanıcıya sorulacak tek şey** | Claude'un yapamayacağı işler — API anahtarı almak, Vercel paneline gizli değer girmek, ürünle ilgili zevk kararları. Bunlar `### Kullanıcıdan bekleyenler` başlığında toplanır. |
| **Değişmeyen** | Kalite. Kararlar `docs/plan.md` §15'e yazılmaya devam eder, her iş biriminde commit atılır, `main` daima çalışır durumda kalır. |

Eski kural (kavramı Claude anlatır, kodu kullanıcı yazar) Aşama 00 ve Aşama 01'in ilk dört adımında
geçerliydi; o dönemin izi `docs/learning-log.md` ve `docs/book/` içinde duruyor ve **silinmiyor** —
kullanıcı kendi projesini yaparken oraya dönecek.

## Kullanıcının seviyesi

**Hiçbir teknolojiyi bilmediğini varsay.** HTML, CSS ve temel JavaScript yazabiliyor; gerisi
(terminal, git, npm, TypeScript, React, Next.js, SQL, PostgreSQL, ortam değişkeni, deploy, dil
modeli API'si, eval) sıfırdan öğrenilmekteydi.

Kodu artık Claude yazdığı için bu bir **anlatım** kuralı değil, bir **rapor** kuralı: aşama sonunda
ne yapıldığı özetlenirken terim tanımsız bırakılmaz, "bunu bilirsin" varsayılmaz. Özet kısa olur ama
anlaşılır olur.

## Kurallar

| | |
|---|---|
| **Teslim** | Aşama aşama. Bir aşama **çalışır ve doğrulanmış** hâlde kapanır; bitiş kriteri karşılanmadan sonrakine geçilmez. |
| **Doğrulama** | İddia edilen her şey çalıştırılarak gösterilir: `npm run typecheck`, `npm run build`, `npm run smoke`, ve ekran görüntüsüyle **gözle** bakmak. "Çalışıyor olmalı" cümlesi kurulmaz. |
| **Dil** | Anlatım ve yorum satırları **Türkçe**. Kod, dosya adı, tablo adı, değişken adı, commit mesajı, dal adı **İngilizce** — istisnasız. |
| **Terim** | **Yazım kalıbı: `migration (göç)`** — İngilizcesi asıl, Türkçesi parantezde, ilk geçişte. Sonraki geçişlerde İngilizcesi. Sadece Türkçesini yazmak yasak. |
| **Yorum** | Kod yorumları **neden**i anlatır, neyi değil. `docs/plan.md` §15'teki kararın gerekçesi, kararın uygulandığı dosyada bir cümleyle tekrar edilir. |
| **Git** | Her iş biriminde commit. Conventional Commits, İngilizce. `main` daima çalışır durumda. |
| **Karar** | Teknoloji seçimi dört soruyla açılır — bu ne yapıyor · onsuz ne olurdu · alternatifi neydi · neden bu — ve `docs/plan.md` §15'e **elenenlerle birlikte** yazılır. Kararı Claude verir; kullanıcı sonradan itiraz edebilsin diye gerekçe eksiksiz yazılır. |
| **Kullanıcıya soru** | Sadece Claude'un yapamayacağı işler: API anahtarı almak, Vercel paneline gizli değer girmek, ürün zevki kararları. Bunun dışında onay beklenmez. |

## Kilitli kararlar

- **İsim: Rung.** Repo, klasör, veritabanı, commit'ler hep bu. Değişmez.
- **Koyu + açık tema.** Koyu varsayılan, açık tema ek. Her iki paletin de renk körlüğü ve
  kontrast açısından ayrıca doğrulanması gerekiyor — göz kararı renk seçilmez.
- **Veritabanı: Neon (bulut PostgreSQL).** Tek veritabanı; yerel kurulum yok. Dev/prod ayrımı gerektiğinde Neon dallanması.
- **Kimlik doğrulama elle yazıldı**, hazır kütüphane yok. Şifre `bcryptjs` (cost 12), oturum
  veritabanında opak jeton — çerezde jeton, veritabanında SHA-256 özeti.
- **Form gönderimi Server Action.** Route Handler yok; gerçekten dışarıdan çağrılan bir uç
  gerekirse açılacak.
- **Kalan teknoloji kararları kilitli değil.** `docs/plan.md` §10'daki liste öneridir. Her seçim
  sırası geldiğinde dört soruyla açılır ve gerekçesiyle §15'e yazılır.

## Hâlâ açık

- Yurtdışı hedefi ne (uzaktan çalışma / taşınma / eğitim) — hedef seviyeyi ve IELTS gereğini belirliyor.
- Haftalık gerçek çalışma saati — plan aynı kalır, takvim değişir.
- Başlangıç İngilizce seviyesi — ilk hafta birkaç kayıtla **ölçülecek**, tahmin edilmeyecek.

Hiçbiri Aşama 0'ı bloke etmiyor.

## Durum

**21 Ağustos 2026 · Aşama 00 ✔ · Aşama 01 ✔ · Aşama 02 ✔ — sıradaki Aşama 03.**

Canlı: **https://rung-plum.vercel.app**
Kurulu: git + GitHub + Vercel · Next.js 16 (Turbopack) · TypeScript katı mod ·
`@neondatabase/serverless` · `bcryptjs` · `server-only` · `puppeteer-core` (test).

### Komutlar

| | |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi — tip hatasında durur |
| `npm run typecheck` | Sadece tip kontrolü |
| `npm run migrate` | Bekleyen migration'ları sırayla uygular |
| `npm run seed` | Bağlam ve görevleri yazar (idempotent) |
| `npm run smoke` | Uçtan uca duman testi, 43 kontrol (dev sunucusu açıkken) |
| `npm run smoke -- --base=https://rung-plum.vercel.app` | Aynı testi canlıya karşı |

### Aşama 01 · Hesap ve oturum — TAMAM

Giriş yapmayan `/dashboard`'u göremiyor. Kimlik doğrulama elle yazıldı: `bcryptjs` cost 12,
oturum veritabanında opak jeton (çerezde jeton, veritabanında SHA-256 özeti), `server-only` ile
veritabanı modülü istemciye sızarsa derleme kırılıyor.

### Aşama 02 · Yazma, saklama, listeleme — TAMAM

Kayıt yazılıp saklanıyor, geçmişte bulunuyor, **başkasının kaydına erişilemiyor**.

| Dosya | İşi |
|---|---|
| `migrations/0003_create_content_tables.sql` | `contexts`, `tasks`, `entries` + değiştirilemezlik trigger'ı + GIN arama indeksi |
| `scripts/seed.mjs` · `scripts/seed-data.mjs` | 5 bağlam, 50 görev; idempotent |
| `app/lib/content.ts` | Bağlam ve görev okuma, rastgele görev seçimi |
| `app/lib/entries.ts` | Kayıt yazma/okuma — **her fonksiyon `userId`'yi WHERE'e koyuyor** |
| `app/lib/entry-actions.ts` | Kaydetme; bağlam istemciden değil görevden okunuyor |
| `app/lib/words.ts` | Kelime sayma — istemci ve sunucu aynı fonksiyonu kullanıyor |
| `app/(app)/layout.tsx` | Giriş yapmışın kabuğu; `(app)` adrese girmeyen grup |
| `app/(app)/write` `history` `entries/[id]` | Üç ekran |

**Kilit kararlar** (gerekçeleri `docs/plan.md` §15'te): kayıtlar veritabanı trigger'ıyla
değiştirilemez · görev seçimi adrese yazılıyor · sahiplik sorgunun içinde, bulunamayınca 404 ·
arama `tsvector` + GIN.

### Sıradaki — Aşama 03 · Deterministik analiz · **YAPAY ZEKÂ YOK**

K0 katmanı: yazım, temel kurallar, kelime seviyesi dağılımı, cümle karmaşıklığı, çeşitlilik.
**Biter:** metin verildiğinde model çağrısı olmadan ölçüm çıkıyor.

### Kullanıcıdan bekleyenler

| Ne zaman | Ne gerekiyor |
|---|---|
| **Aşama 04'e girerken** | Dil modeli API anahtarı. Anthropic Console'dan alınıp `ANTHROPIC_API_KEY` adıyla hem `.env.local`'e hem Vercel paneline girilecek — panele **tırnaksız**. |
| **Aşama 04'te** | Aylık maliyet tavanı kararı (kayıt başı ~$0.01 hedefleniyor). |
| Şimdilik | Başka bir şey yok. |

### Öğrenme günlüğü — ÖNCE BUNU OKU

[`docs/learning-log.md`](docs/learning-log.md) — hangi kavram ilk seferde oturmadı, hangi anlatım tuttu,
hangi yöntem işe yaramadı. Yeni bir aşamaya başlamadan önce okunur; aynı duvara ikinci kez toslamamak için.
Her aşama sonunda güncellenir.

### Kitap — Sıfırdan Next.js

[`docs/book/nextjs-from-zero.html`](docs/book/nextjs-from-zero.html) (ekranda şekiller kaydırınca oynuyor)
ve aynı içeriğin baskıya hazır hâli `nextjs-from-zero.pdf` — 38 sayfa, 8 bölüm, 15 şekil,
bölüm sonlarında 21 kontrol sorusu, cevapları arkada.
Aşama 00'ın tamamı ile Next.js'in bütün temel kavramları (yönlendirme, iç içe layout,
`"use client"` sınırı, statik/dinamik render) içinde. **Sonraki aşamalar bittikçe bölüm eklenir.**

### Ders notları

`docs/lessons/stage-NN.html`, hepsi aynı kalıpta: hızlı bakış komut kartı → adım adım kavramlar →
tuzaklar tek listede → sözlük. Aşama 00: [`docs/lessons/stage-00.html`](docs/lessons/stage-00.html) — 21 adım, 12 tuzak, 24 terim.
**Her adımdan sonra `docs/design/roadmap.html` ilerleme işaretleri güncellenir; aşama bitince ders notu yazılır.**
