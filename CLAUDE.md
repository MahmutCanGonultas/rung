# Rung — bu projede nasıl çalışıyoruz

> Bu dosya bu klasörde açılan her Claude oturumunda otomatik okunur.
> Buradaki kurallar teknik kararlardan önce gelir. Çelişki olursa bu dosya kazanır.

## Proje nedir

Rung, Türkçe konuşanlar için bir **İngilizce ölçüm aleti** — kurs değil, sohbet botu değil, yazım
denetleyicisi değil. Kullanıcının yazdığı İngilizceye bakıp hatayı sabit bir taksonomiye yazar,
aylar boyunca izler, ve **kendi doğruluğunu ölçer**.

Ürün önizlemesi: [`docs/design/product.html`](docs/design/product.html) — beş ekran (Yaz · Analiz · Geçmiş · İlerleme · Doğruluk), çalışan sekmeler, koyu/açık tema.
Plan: [`docs/plan.md`](docs/plan.md) (yazılı, karar günlüğü dâhil) · [`docs/design/roadmap.html`](docs/design/roadmap.html) (görsel, adım adım).

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

**14 Ağustos 2026 · Aşama 00 TAMAMLANDI — 21 / 21 adım.**

Canlı: **https://rung-plum.vercel.app** · Her istekte Neon'a (Frankfurt) sorgu atıyor, saat değişiyor.
Kurulu: git + GitHub + Vercel · Next.js 16 · TypeScript katı mod · `@neondatabase/serverless`.

### SIRADAKİ — Aşama 01: Hesap ve oturum (~6 sa, 8 adım)

Kayıt, giriş, çıkış, korumalı sayfa. Adımlar:
kimlik doğrulama ile yetkilendirme farkı · `users` tablosu · **göç (migration) nedir** ·
şifre neden düz saklanmaz (hash) · kayıt formu + sunucu tarafı doğrulama ·
giriş, oturum ve çerez · çıkış · korumalı sayfa.

**Biter:** giriş yapmayan kullanıcı korumalı sayfayı göremiyor.

**İlk konuşulacak karar:** kimlik doğrulamayı hangi araçla yapacağız — dört soruyla açılacak,
kararı kullanıcı verecek.

### Ders notları

`docs/lessons/stage-NN.html`, hepsi aynı kalıpta: hızlı bakış komut kartı → adım adım kavramlar →
tuzaklar tek listede → sözlük. Aşama 00: [`docs/lessons/stage-00.html`](docs/lessons/stage-00.html) — 21 adım, 12 tuzak, 24 terim.
**Her adımdan sonra `docs/design/roadmap.html` ilerleme işaretleri güncellenir; aşama bitince ders notu yazılır.**
