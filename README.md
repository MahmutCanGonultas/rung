# Rung

Türkçe konuşanlar için bir **İngilizce ölçüm aleti**. Kurs değil, sohbet botu
değil, yazım denetleyicisi değil.

Yazdığın İngilizceye bakıp hatayı sabit bir taksonomiye yazar, aylar boyunca
izler, ve **kendi doğruluğunu ölçer**.

**Canlı:** https://rung-plum.vercel.app

---

## Neden

%100 doğruluk mümkün değil — dil modelleri olasılıksal çalışır. Bunu garanti
eden herkes yanılıyor, ve bunu kabul etmeden tasarlanan sistem yanlış
tasarlanır.

Bu projenin cevabı "umarız doğrudur" değil: **ölçülmüş güven.** Doğruluk
panosu isabeti, yakalamayı, yanlış alarm oranını ve maliyeti seviye
kırılımıyla gösteriyor. Zayıf yer gizlenmiyor.

> Asıl problem hangi hatayı kaçırdığın değil. Bir hatayı kaçırırsan kullanıcı
> fark etmez. Ama doğru olan cümlesini "düzeltirsen" güvenini anında
> kaybedersin. Bu yüzden sistemin ana ölçütü yakalama oranı değil,
> **yanlış alarm oranı**.

---

## Analiz hattı

Beş katman — ve **üçü yapay zekâ kullanmıyor.**

| Katman | Ne yapar | Model? |
|---|---|---|
| **K0 · Deterministik** | Yazım, temel kurallar, kelime bandı, cümle karmaşıklığı, çeşitlilik | **Yok** |
| **K1 · Çıkarım** | Hata çıkarımı — sabit taksonomiye ve zorunlu şemaya yazmak zorunda | Model |
| **K2 · Doğrulama** | Her bulguya bağımsız olarak "bu gerçekten hata mı" | Model |
| **K3 · Süzme** | Seviyeye göre önceliklendirme ve adet sınırı | **Yok** |
| **K4 · Kayıt** | Metin + bulgular + model kimliği + prompt sürümü | **Yok** |

Modele ne kadar az iş verirsen o kadar az saçmalıyor. K1'in ürettiği her bulgu
metinde aranıyor; bulunamayan kullanıcıya hiç gösterilmiyor.

---

## Kurulum

```bash
npm install
cp .env.local.example .env.local   # DATABASE_URL ve ANTHROPIC_API_KEY doldur
npm run migrate                    # şemayı kur
npm run seed                       # bağlamlar ve görevler
npm run seed:gold                  # ölçüm için altın küme
npm run dev
```

`DATABASE_URL` bir Neon (bulut PostgreSQL) bağlantı dizesi.
`ANTHROPIC_API_KEY` model katmanı için gerekiyor; olmadan K0 çalışır, K1/K2
çalışmaz ve ekran bunu söyler.

## Komutlar

| | |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi — tip hatasında durur |
| `npm run typecheck` | Sadece tip kontrolü |
| `npm test` | Birim testleri, model gerektirmez |
| `npm run smoke` | Uçtan uca test — gerçek tarayıcı sürüyor |
| `npm run migrate` | Bekleyen migration'ları sırayla uygular |
| `npm run seed` · `seed:gold` | İçerik ve altın küme |
| `npm run eval` | Ölçüm koşumu · `-- --fake` anahtarsız |
| `npm run gold:from-feedback` | İtirazları altın kümeye akıtır · `-- --dry` |

Model ve çaba ortam değişkeninde: `RUNG_K1_MODEL`, `RUNG_K1_EFFORT`.
Sahte modelle çalıştırmak için `RUNG_FAKE_MODEL=1`.

---

## Yapı

```
app/
  (app)/            giriş yapmışın gördüğü ekranlar
  lib/
    k0/             deterministik analiz — model yok
    k1/             model çıkarımı, sağlayıcı soyutlaması, şema doğrulama
    k2/             ikinci geçiş, şüpheli damgası
    k3/             seviye tahmini ve seviyeye göre süzme
    eval/           isabet / yakalama / yanlış alarm
migrations/         numaralı, dondurulmuş SQL
scripts/            migration, tohum veri, ölçüm, duman testi
docs/
  plan.md           plan ve karar günlüğü (gerekçeleriyle)
  design/           ürün önizlemesi ve yol haritası
```

## Kararlar

Her teknoloji seçimi `docs/plan.md` §15'te, **elenen alternatiflerle
birlikte** yazılı. Örnek: yazım denetleyicisi tercihle değil ölçümle seçildi —
40 hatalı + 40 doğru kelimede iki aday karşılaştırıldı, kazanan %0 yanlış
alarm verdi, kaybeden %57,5.

## Teknoloji

Next.js 16 (App Router) · TypeScript katı mod · PostgreSQL (Neon) ·
Vercel · elle yazılmış kimlik doğrulama (`bcryptjs`) · Anthropic API

## Lisans

MIT
