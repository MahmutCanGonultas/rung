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
| **Kullanıcıya sorulacak tek şey** | Claude'un yapamayacağı işler — API anahtarı almak, Vercel paneline gizli değer girmek, ürünle ilgili zevk kararları. Bunlar `### Kullanıcıdan bekleyenler

**1 · Anthropic API anahtarı — Aşama 04'ün son adımı buna bağlı.**

| # | Ne yapılacak |
|---|---|
| 1 | console.anthropic.com → giriş yap |
| 2 | **API Keys** → *Create Key* → adı `rung` olsun, kopyala |
| 3 | Proje kökündeki `.env.local` dosyasına yeni satır: `ANTHROPIC_API_KEY=sk-ant-...` — **tırnak yok** |
| 4 | Vercel → proje → **Settings → Environment Variables** → `ANTHROPIC_API_KEY`, aynı değer, **tırnaksız**, üç ortamı da işaretle |
| 5 | Bana "anahtar hazır" de |

Aşama 00'da tırnaklı yapıştırma bir kez `password authentication failed` verdirmişti — panelde tırnak yok.

**2 · Maliyet tavanı kararı.** `claude-opus-5` ile kayıt başı ~$0,02; ikinci geçiş (K2) eklenince ~$0,04.
Ayda 100 kayıt ≈ $4. Kabul mü, yoksa ikinci geçişi daha ucuz bir modele mi verelim — senin kararın.
Console'da **Limits** altından aylık sert tavan da koyabilirsin.

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
