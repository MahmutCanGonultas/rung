# Yayın — panelde yapılacaklar

Kod tarafında yapılacak bir şey kalmadı. Bu dosyadaki adımlar **Vercel ve
Resend panellerinde** yapılıyor; hepsi tarayıcıda, toplam yirmi dakika.

> **Neden şart:** hesap artık kayıt formunda açılmıyor. Form yalnızca bekleyen
> bir kayıt yazıyor ve adrese bir bağlantı yolluyor; `users` satırı o bağlantıya
> tıklanınca oluşuyor. Yani **mail gitmiyorsa kimse kaydolamıyor.** Şu anda
> canlıda kayıt ekranı dürüstçe "doğrulama e-postası gönderilemedi" diyor.
> Aşağıdaki adımlar bitince açılıyor.

---

## 1 · Alan adını al

Vercel → proje → **Domains** → **Buy a domain**.

30 Ağustos 2026'da RDAP ve DNS ile kontrol edildi, hepsi boşta:

| alan adı | not |
|---|---|
| **`rungscale.com`** | önerilen — "rung" + ölçek, ürünün ne yaptığını söylüyor |
| `rungmeter.com` | aynı fikir, İngilizce ölçü aleti |
| `runglevel.com` | seviye vurgusu |
| `rungmetre.com` | Türkçe okunuşa yakın |
| `rungband.com` | bant (A1–C1) vurgusu |

`rung.com`, `rung.app`, `rung.dev`, `rung.net`, `rung.org` **alınmış.**

Fiyat `.com` için yılda ~11 $ ve Vercel'de sabit. Aldıktan sonra Vercel alan
adını projeye kendisi bağlıyor — DNS ile uğraşmıyorsun.

---

## 2 · Resend'i kur

Vercel → proje → **Integrations** (ya da soldaki **Storage/Marketplace**) →
**Resend** → **Add Integration** → **Free** planı.

Kurulum bitince `RESEND_API_KEY` ortam değişkeni **projeye kendiliğinden**
giriyor. Anahtarı hiçbir yere yapıştırman gerekmiyor; bana da gönderme.

> Alternatif: **Brevo** (günde 300 mail, Resend'de 100). Ayrı hesap açman ve
> anahtarı elle `BREVO_API_KEY` olarak eklemen gerekir. Kod ikisini de
> destekliyor ve hangisinin anahtarı varsa onu kullanıyor. Tek panelde kalmak
> istiyorsan Resend.

---

## 3 · Alan adını Resend'de doğrula

Resend paneli → **Domains** → **Add Domain** → `rungscale.com`.

Resend sana üç-dört DNS kaydı veriyor (DKIM ve SPF). Vercel → proje →
**Domains** → alan adı → **DNS Records** ekranına birer birer gir.

**Dikkat:** Vercel'in `Name` alanına **yalnızca ön eki** yaz. Resend
`resend._domainkey.rungscale.com` diyorsa Vercel'e `resend._domainkey`
yazılıyor — tam adı yazarsan kayıt `resend._domainkey.rungscale.com.rungscale.com`
oluyor ve doğrulama hiç geçmiyor.

Kayıtlar yayıldıktan sonra (genelde birkaç dakika) Resend'de **Verify**.

---

## 4 · DMARC kaydını elle ekle

Resend bunu istemiyor ama **Microsoft Mayıs 2025'ten beri istiyor**: DMARC
kaydı olmayan alan adlarından gelen postayı Outlook/Hotmail spam'e atıyor.
Senin kendi adresin de `@hotmail.com` — yani bu kayıt olmadan kendi doğrulama
mailini göremezsin.

Vercel → **DNS Records** → **Add**:

| alan | değer |
|---|---|
| Type | `TXT` |
| Name | `_dmarc` |
| Value | `v=DMARC1; p=none; rua=mailto:mahmutcangonultas@outlook.com` |

`Name` alanına **`_dmarc`** yaz, `_dmarc.rungscale.com` değil — 3. adımdaki
aynı tuzak.

`p=none` "kimseyi engelleme, sadece rapor gönder" demek. Doğru başlangıç:
`p=reject` ile başlarsan bir yapılandırma hatası bütün mailleri sessizce
öldürür.

---

## 5 · Üç ortam değişkeni

Vercel → proje → **Settings → Environment Variables**. Üçü de **Production**
için (istersen Preview'a da):

| ad | değer |
|---|---|
| `MAIL_FROM` | `merhaba@rungscale.com` |
| `MAIL_FROM_NAME` | `Rung` |
| `APP_URL` | `https://rungscale.com` |

`MAIL_FROM` **doğrulanmış alan adına ait olmak zorunda.** `@gmail.com` ya da
`@outlook.com` yazarsan Resend reddeder.

`APP_URL`'in iki işi var: doğrulama bağlantılarının kökü ve paylaşım kartının
kökü. `VERCEL_URL` kullanılmıyor — o adres her dağıtımda değişiyor ve
gönderilmiş bir bağlantı bir sonraki dağıtımda ölürdü.

---

## 6 · Yeniden dağıt

Ortam değişkeni eklemek tek başına yeni dağıtım tetiklemiyor.
Vercel → **Deployments** → en üsttekinin sağındaki `⋯` → **Redeploy**.

---

## 7 · Gerçek testi

1. `https://rungscale.com/register` → kendi adresinle kaydol.
2. Ekran **"kutuna bak"** demeli, hata değil.
3. Mail gelmeli. **Gelen kutusuna mı düştü, spam'e mi — bak ve not et.**
4. Bağlantıya tıkla → hesap açılmalı ve doğrudan yazma ekranına düşmeli.
5. Çıkış yap → **Şifremi unuttum** → sıfırlama maili de gelmeli.

Mail spam'e düştüyse Gmail'de maili aç → `⋮` → **Orijinali göster** →
`Authentication-Results` satırına bak: `dkim=pass` ve `dmarc=pass` yazmalı.
Biri `fail` diyorsa 3. veya 4. adımdaki bir DNS kaydı eksik ya da `Name`
alanına tam ad yazılmış.

---

## Sonrası — kodda yapılacaklar

Alan adı çalıştıktan sonra bende kalan iş:

- `README.md` ve paylaşım kartındaki canlı adresi yeni alan adına çevirmek
  (`APP_URL` zaten kartı sürüklüyor, kalan yerler metin).
- Duman testini yeni adrese karşı bir kez koşturmak:
  `npm run smoke -- --base=https://rungscale.com`
- Eski `rung-plum.vercel.app` adresini yeni alan adına yönlendirmek.

## Kalan tek gerçek hesap

Veritabanında yalnızca senin hesabın var (`m.cangonultas@hotmail.com`) ve
adresi **doğrulanmamış** — bekleyen kayıt modelinden önce açılmıştı. Mail
çalışmaya başlayınca kabuktaki şeritten "yeniden gönder" diyebilir ya da
şifreni sıfırlayabilirsin; sıfırlama adresi kendiliğinden doğrulanmış sayıyor.
Test hesapları (`shots-*`, `smoke-*`, `del-*`) temizlendi.
