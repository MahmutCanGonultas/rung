# Rung — proje planı

> Sürüm 0.1 · 11 Ağustos 2026
> Kaynak: `~/Desktop/rung-proje-plani.pdf` — bu dosya onun proje içinden okunabilir hâli.
> Karar değişiklikleri en altta "Karar günlüğü" bölümüne işlenir.

**Rung bir kurs değil, bir ölçüm aleti.** İngilizce öğretmiyor; senin ürettiğin İngilizceye bakıp
nerede, neden ve ne sıklıkla hata yaptığını çıkarıyor, aylar boyunca takip ediyor ve o zayıflıkları
hedefliyor. Ve kendi doğruluğunu ölçüyor — çünkü ölçmediğin bir teşhise güvenilmez.

| | |
|---|---|
| Tahmini süre | ~62 saat |
| Haftada 10 saatte | ~6 hafta (haftada 6 saatte ~10 hafta) |
| Aşama | 9 |
| Platform | Web |
| Durum | Aşama 0 başlamadı |

---

## 01 · Neden bu proje

İki iş aynı anda: **işe alınabilir bir geliştirici olmak** ve **yurtdışı hedefi için İngilizce**.
Tek bir şey yaparak iki hedefe yürümek, sınırlı zamanı olan biri için en verimli hamle.

Asıl gerekçe: 2026'da "Next.js ile CRUD yazabiliyorum" cümlesinin piyasa değeri sıfıra yakın — onu
yapay zekâ yirmi dakikada üretiyor. Değeri artan şey **yargı**: yapay zekânın ürettiği çıktının doğru
olup olmadığını anlayabilmek, ölçebilmek, ve neyin yapay zekâya verilmeyeceğini bilmek.

> Herkes iki günde bir yapay zekâ özelliği yapabiliyor. Kimse o özelliğin çalıştığını
> kanıtlayamıyor. Boşluk orada.

- **Birincil kullanıcı: sen.** Her gün kullanılacak — kullanılmayan proje ölür.
- **Gerçek kitle: Türkçe konuşanlar.** "Tek kullanıcısı sensin" zaafı burada kırılıyor.
- **Portfolyo değeri: ölçüm katmanı.** Projenin kendisi değil, doğruluğunu nasıl ölçtüğün konuşulacak.

---

## 02 · Ne değil

Kapsam önce *dışarıdan* çizilir, yoksa proje şişer ve biter. Bunlar eksik değil, **karar**:

- **Kurs değil.** Ders anlatmaz, gramer konusu öğretmez. Duolingo bunu iyi yapıyor; yenmeye
  çalışmak 60 saatlik projeyi 600 saate çıkarır.
- **Sohbet botu değil.** Modelle konuşmuyorsun; modele metin verip *ölçülmüş* geri bildirim
  alıyorsun. Aradaki fark, projenin tamamı.
- **Yazım denetleyicisi değil.** Grammarly cümleyi düzeltir ve unutur. Rung cümleyi düzeltir,
  *kaydeder*, ve altı ay sonra "bu hatayı 34 kez yaptın, azalıyor" der.
- **Oyunlaştırma yok.** Seri sayacı, rozet, puan, günlük hedef bildirimi — hiçbiri.
- **Çoklu dil yok, mobil uygulama yok, sosyal katman yok.**

---

## 03 · Nasıl çalışır

Tek bir döngü var:

| # | Adım | Ne oluyor |
|---|---|---|
| 1 | Bağlam seç | Günlük hayat, iş yeri, teknik, resmî, serbest. Her bağlamın kendi değerlendirme ölçütü var. |
| 2 | Görev al | Seviyene uygun somut görev. Ya da serbest yaz. |
| 3 | Yaz | Metni üretirsin. (v2: konuşursun.) |
| 4 | Analiz | Beş katmanlı hat — §04. |
| 5 | Geri bildirim | **Seviyene göre kısıtlanmış.** A1'e en önemli 3 hata; C1'e nüans dâhil hepsi. |
| 6 | İtiraz et | Katılmadığın düzeltmeyi işaretlersin. İtirazlar doğruluk ölçümünün ham verisi. |
| 7 | Kayıt | Metin, bulgular, model kimliği, prompt sürümü birlikte saklanır. Kayıtlar değiştirilemez. |
| 8 | Birikim | Hata profilin, seviye tahminin ve hedefli tekrarların buradan çıkar. |

---

## 04 · Analiz hattı

Projenin teknik kalbi. Dikkat: yapay zekâ hattın *tamamı* değil, *bir katmanı*.
Modele ne kadar az iş verirsen o kadar az saçmalar.

| Katman | Ne yapar | Model? |
|---|---|---|
| **K0 · Deterministik** | Yazım denetimi, temel gramer kuralları, kelime seviyesi dağılımı, cümle uzunluğu ve karmaşıklığı, kelime çeşitliliği. Düz kodla: bedava, anlık, her seferinde aynı sonuç. | **Yok** |
| **K1 · Çıkarım** | Hata çıkarımı. Model serbest metin üretemez — **sabit taksonomiye ve zorunlu şemaya** yazmak zorunda. Her bulgu: tam konum, kategori, önerilen düzeltme, güven değeri. | Model |
| **K2 · Doğrulama** | Her bulguya ayrıca "bu *gerçekten* hata mı?" sorulur. Maliyeti artırır, **yanlış alarmı ciddi düşürür**. Doğru cümleni düzelten araca kimse güvenmez. | Model |
| **K3 · Süzme** | Tahmini seviyeye göre bulgular sıralanır ve **sayısı sınırlanır**. A1'in cümlesinde on hata vardır; onuncusunu da yüzüne vurursan uygulamayı siler. | **Yok** |
| **K4 · Kayıt** | Metin + bulgular + **model kimliği + prompt sürümü**. Sürüm tutulmazsa "6 ayda ilerledim" grafiği yalan söyler. | **Yok** |

> **Buradaki asıl ders:** Beş katmanın **üçü** yapay zekâ kullanmıyor. Neyin modele verilmeyeceğini
> bilmek, "yapay zekâ kullanabiliyorum"dan daha güçlü bir sinyal — ilki bir karar, ikincisi artık
> herkesin yaptığı şey.

---

## 05 · Hata taksonomisi

Model bugün "yanlış edat", yarın "preposition error" derse hiçbir şey takip edilemez. Kategoriler
**önceden sabitlenir** ve model onlara yazmaya zorlanır.

| Aile | Alt kategoriler | Örnek |
|---|---|---|
| Gramer | zaman, özne-yüklem uyumu, artikel, edat, çoğul, kip, sözcük sırası | `I go to school yesterday` |
| Sözcük | yanlış kelime, eşdizim, sayılabilirlik, kayıt uyumu | `make a research` |
| Mekanik | yazım, noktalama, büyük harf | `i think its fine` |
| Söylem | bağlantı, gereksiz tekrar, belirsizlik | üç cümlede aynı şeyi söylemek |
| **Türkçe kaynaklı** | artikel düşürme, birebir çeviri, sözcük sırası, *"I am agree"* kalıbı | `the meeting of tomorrow` |

> **Türkçe kaynaklı neden ayrı bir aile:** Türkçede artikel yok, cinsiyetli zamir yok, sözcük sırası
> farklı. Bu yüzden Türkçe konuşanlar **öngörülebilir ve karakteristik** hatalar yapar. Ayrı izlemek
> hem daha isabetli teşhis verir hem de genel bir dil aracının veremeyeceği bir şey — projenin ayırt
> edici tarafı burada.

---

## 06 · Seviye motoru

Projenin en zor kısmı. Sebebi tek cümle: **"I go to school yesterday."**

- **A1 için:** zaman hatası dersin ta kendisi, mutlaka düzeltilmeli.
- **C1 için:** bu bir dalgınlık; düzeltmek işe yaramaz. C1'in sorunları başka yerde — kayıt uyumu,
  doğal olmayan eşdizimler, gereksiz sertlik, artikel incelikleri.

Yani **aynı hatanın önemi seviyeye göre değişiyor**. Bu, seviyeyi sistemin kenarına değil merkezine koyuyor.

### Seviyeyi nereden biliyoruz

Kullanıcıya sormak güvenilmez — insanlar kendi seviyesini yanlış tahmin eder. **Ölçüyoruz**, ve
tamamen K0 katmanının verisiyle:

- **Kelime seviyesi dağılımı** — kullandığın kelimelerin hangi bantlara düştüğü
- **Cümle karmaşıklığı** — yan cümle kullanımı, ortalama uzunluk
- **Hata yoğunluğu** — 100 kelimede kaç bulgu
- **Hata *türü*** — en belirleyicisi: temel gramer mi, nüans mı

Kapsam A1–C1. Tahmin sürekli güncellenir; "ilerleme" dediğin şey bu bandın kayması.

> **Bunun eval'e faturası:** Altın küme tek parça olamaz. A1, B1 ve C1 için **ayrı ölçüm kümesi**
> gerekiyor — doğruluk seviyeye göre değişiyor ve tek bir ortalama sayı bu gerçeği gizler.
> Projeyi büyüten en pahalı istek bu.

---

## 07 · Doğruluk: sistemin omurgası

**%100 doğruluk mümkün değil.** Dil modelleri olasılıksal çalışır. Bunu garanti eden herkes
yanılıyor, ve bunu kabul etmeden tasarlanan sistem yanlış tasarlanır.

Doğru mühendislik cevabı "umarız doğrudur" değil, beş şeyi birden yapmaktır:

1. **ÖLÇ — Altın küme.** Hataları önceden bilinen paragraflar. İki sayı: bulduklarının kaçı gerçek
   hata (**isabet**), gerçek hataların kaçını yakalamış (**yakalama**).
2. **DARALT — Şema zorlaması.** Modele açık uçlu soru sorulmaz. Sabit kategori, zorunlu şema.
3. **AYIR — Deterministik önce.** Yazım ve temel kurallar için model gerekmez. Modele sadece yorum
   gerektiren kısım gider.
4. **DOĞRULA — İkinci geçiş.** Her bulguya bağımsız olarak "bu gerçekten hata mı?" sorulur.
5. **DİNLE — İtiraz döngüsü.** Kullanıcı katılmadığı düzeltmeyi işaretler. O itirazlar altın kümeyi
   kendiliğinden büyütür.

**Sonuç: ölçülmüş güven.** "Kesinlikle doğru" değil — "doğruluğu ölçülmüş, ve her seviye için ayrı ölçülmüş".

> **Asıl problem hangi hatayı kaçırdığın değil.** Bir hatayı kaçırırsan kullanıcı fark etmez. Ama
> **doğru olan cümlesini "düzeltirsen"** güvenini anında kaybedersin. Bu yüzden sistemin ana ölçütü
> yakalama oranı değil, **yanlış alarm oranı**.

---

## 08 · Ekranlar

Dört ekran, dört iş. Koyu ve sakin bir arayüz: ölçüm aleti gibi görünmeli, dil uygulaması gibi değil.
Renk sadece *anlam* taşıdığında — turuncu hata, sarı öneri, gri şüpheli, yeşil onay.

1. **Yazma** — bağlamı seç, görevi al, yaz. Görev seviyene göre öneriliyor; boş sayfa en büyük caydırıcı.
2. **Analiz** — ana ekran. Bulgular önem sırasında, seviyeye göre sayısı sınırlı, her birinde
   "katılmıyorum", ikinci geçişi geçemeyen bulgu **şüpheli** olarak işaretli ve istatistiğe girmiyor.
3. **İlerleme** — "ilerliyor muyum?" sorusunun veriyle cevabı. İnatçı kategori, bir sonraki tekrar
   setinin hangi hatadan üretileceğini belirliyor.
4. **Doğruluk panosu** — projenin vitrini. Yanlış alarm, yakalama, altın küme boyutu, kayıt başı
   maliyet, ve **seviye kırılımlı isabet**. Zayıf yer gizlenmez.

Çalışan maket: [`../design/product.html`](../design/product.html)

---

## 09 · Veri modeli

Dokuz tablo. Dikkat: `gold_items` ve `eval_runs` şemada **ilk günden** var. Ölçüm sonradan eklenen
bir özellik değil, ürünün parçası.

| Tablo | İçerik |
|---|---|
| `users` | hesap, tercih edilen bağlamlar, hedef seviye |
| `contexts` | günlük / iş / teknik / resmî / serbest — **kod değil veri**, yeni bağlam eklemek satır eklemektir |
| `tasks` | bağlam ve seviyeye bağlı somut görevler |
| `entries` | kullanıcının ürettiği metin, bağlam, görev, zaman — **değiştirilemez** |
| `analyses` | bir kayda ait analiz koşumu + `model_id` + `prompt_version` |
| `findings` | metindeki konum, kategori, alt kategori, öneri, güven, ikinci geçiş sonucu |
| `finding_feedback` | kullanıcının kabulü veya itirazı — eval'in ham verisi |
| `level_estimates` | tarih, tahmini seviye, dayandığı metrikler — zaman serisi |
| `gold_items` · `eval_runs` | altın küme örnekleri ve ölçüm koşumları, seviye kırılımlı |

---

## 10 · Teknoloji — öneri, karar değil

Bu bölüm bilinçli olarak **"kilitli kararlar" listesi değil.** Değerlendiremediğin bir karara onay
veremezsin; onay veremediğin bir karar da sana yargı kazandırmaz. Her seçim, sırası geldiğinde dört
soruyla açılacak ve **kararı kullanıcı verecek**: *bu ne yapıyor · onsuz ne olurdu · alternatifi
neydi · neden bu.*

| Katman | Öneri | Gerekçe / alternatif |
|---|---|---|
| Çerçeve | Next.js | Tek uygulama, sunucu ve arayüz bir arada. Alternatif: ayrı API + arayüz — daha öğretici ama daha yavaş. |
| Dil | TypeScript | Şema ve tip aynı yerden gelsin. Katı mod açık. |
| Veritabanı | PostgreSQL | İlişkisel model gerçekten gerekiyor: kayıt → analiz → bulgu → geri bildirim zinciri. |
| Model erişimi | Sağlayıcı soyutlaması | Sağlayıcıya özgü API yok, her şey ortam değişkeni. Sağlayıcı değiştirmek bir günlük iş olmalı. |
| Deterministik katman | Açık kaynak dil aracı | Yazım ve temel kurallar için. Aşama 3'te iki alternatif denenip ölçülecek. |
| Test | Birim testi | Özellikle K0 katmanı ve eval hesapları — deterministik, test edilmeye en uygun yer. |

### Bilerek kullanmadıklarımız

- **Monorepo, Turborepo** — tek uygulama var. Bizde olmayan bir problemi çözüyor.
- **Kuyruk, worker, Redis** — analiz 5–10 saniye sürüyor. Arka plana atmaya gerek yok.
  (v2'de ses gelince gerekecek — o zaman öğreneceğiz, şimdi değil.)
- **Nesne depolama** — v1'de dosya yok.
- **Karmaşık durum yönetimi kütüphanesi** — ekranlar buna ihtiyaç duyacak kadar karmaşık değil.

---

## 11 · Aşamalar

Sıra **bağlayıcı**. Her aşama çalışır ve yayınlanmış kodla kapanır; bitiş kriteri karşılanmadan
sonrakine geçilmez.

### Aşama 0 · İskelet ve ilk yayın — ~5 sa
Boş ama uçtan uca çalışan, canlıda duran bir temel.
**Öğrenilen:** sürüm kontrolü ve commit mantığı · paket yöneticisi · TypeScript yapılandırması ·
ortam değişkeni ve gizli anahtar · dağıtım nedir
**Biter:** canlı adreste açılan sayfa, veritabanına bağlı, GitHub'da düzenli geçmiş

### Aşama 1 · Hesap ve oturum — ~6 sa
Kayıt, giriş, çıkış, korumalı sayfa.
**Öğrenilen:** kimlik doğrulama ile yetkilendirme farkı · oturum ve çerez · şifre saklama neden özel
bir iş · veritabanı göçü
**Biter:** giriş yapmayan korumalı sayfayı göremiyor

### Aşama 2 · Yazma ve saklama — ~7 sa
Bağlam seç, görev al, yaz, kaydet, listele. Henüz analiz yok.
**Öğrenilen:** ilişkisel modelleme · yabancı anahtar · sunucu/istemci bileşen farkı · form doğrulama ·
sahiplik kontrolü
**Biter:** kayıt yazılıp saklanıyor, başkasının kaydına erişilemiyor

### Aşama 3 · Deterministik analiz — ~7 sa · **YAPAY ZEKÂ YOK**
K0 katmanı: yazım, kurallar, kelime seviyesi, karmaşıklık metrikleri.
**Öğrenilen:** metin işleme · ölçüm tasarımı · neyin yapay zekâ gerektirmediğini görmek · test edilebilir kod
**Biter:** metin verildiğinde model çağrısı olmadan ölçüm çıkıyor

### Aşama 4 · Model katmanı — ~8 sa
K1: taksonomiye zorlanmış hata çıkarımı.
**Öğrenilen:** dil modeli nasıl çağrılır · istem tasarımı · yapılandırılmış çıktı ve şema zorlama ·
token ve maliyet · hata ve yeniden deneme · sağlayıcı soyutlaması
**Biter:** metinden şemaya uygun, konumlu bulgular geliyor ve saklanıyor

### Aşama 5 · Doğrulama ve eval — ~10 sa · **KALP**
K2 ikinci geçiş · altın küme · isabet ve yakalama ölçümü · prompt sürümleme · itiraz döngüsü.
**Öğrenilen:** eval tasarımı · isabet/yakalama takası · yanlış alarm neden daha pahalı · sürümleme
olmadan karşılaştırma neden yalan söyler
**Biter:** prompt değiştiğinde iki sürüm sayılarla kıyaslanabiliyor

### Aşama 6 · Seviye motoru — ~8 sa
K3: seviye tahmini ve seviyeye göre süzme, önceliklendirme, adet sınırı.
**Öğrenilen:** ölçütten sınıflandırmaya geçmek · eşik belirleme · aynı çıktıyı farklı kullanıcıya
farklı sunmak
**Biter:** aynı metin A1 ve C1 kullanıcısına farklı geri bildirim veriyor

### Aşama 7 · Geçmiş ve ilerleme — ~6 sa
Zaman serisi, kategori dağılımı, aynı görevin eski hâliyle karşılaştırma.
**Öğrenilen:** toplulaştırma sorguları · N+1 problemi · veritabanı indeksi · zaman serisi verisi sunmak
**Biter:** 6 aylık veriyle sayfa hızlı açılıyor, ilerleme okunabiliyor

### Aşama 8 · Cila, test, yayın — ~5 sa
**Öğrenilen:** ne test edilir ne edilmez · hata takibi ve günlükleme · erişilebilirlik temelleri ·
README ve demo
**Biter:** kritik akışlar testli, CI yeşil, README canlı bağlantıyla hazır

> **Sıradaki bir detay değil:** Aşama 3, Aşama 4'ten **önce** geliyor — deterministik katman, model
> katmanından önce. Bu bilinçli. Önce yapay zekâ olmadan ne kadar yol alınabileceğini görürsen,
> modeli nereye koyacağına dair sezgin oluşur. Tersini yaparsan her şeyi modele sorarsın.

---

## 12 · v2 · sonraya bırakılanlar

İyi fikir olmadıkları için değil, v1'in bitmesi gerektiği için:

- **Konuşma** — 60 saniyelik ses kaydı → metne çevirme → analiz. Yeni teknik boyut: dosya depolama,
  uzun işlem, kuyruk. Asıl hedef konuşabilmek olduğu için bu en önemli ekleme.
- **Hedefli tekrar** — kendi hatalarından üretilen alıştırma, aralıklı tekrarla.
- **Kelime dağarcığı** — kullanmadığın ama seviyene ait olan kelimeler; aktif/pasif ayrımı.
- **Paylaşım** — diğer kullanıcılar. v1'de tek kullanıcı sensin.

---

## 13 · Riskler — dürüst liste

| Risk | Cevabımız |
|---|---|
| **Alan kalabalık** | Grammarly, LanguageTool ve onlarca araç var. Ama hiçbiri uzun vadeli teşhis yapmıyor, hiçbiri Türkçe kaynaklı hataları ayrı izlemiyor, ve neredeyse hiçbiri kendi doğruluğunu ölçmüyor. |
| **C1 doğruluğu düşecek** | Nüans hataları modeller için gerçekten zor. Gizlemiyoruz — panoda seviye kırılımlı gösteriyoruz. |
| **Altın küme emek ister** | Küçük başla (seviye başına 30–40), itiraz döngüsüyle kendiliğinden büyüsün. |
| **Kullanmayı bırakma** | Bu ölçekteki projeleri büyüklük değil düzensizlik öldürür. Sabit çalışma günü, her oturum yayınlanmış kodla bitsin, Aşama 0'dan itibaren canlıda bir şey olsun. |
| **Maliyet** | Kayıt başı maliyet ilk günden ölçülüyor ve panoda duruyor; K0 katmanı yükün bir kısmını bedavaya alıyor. |

---

## 14 · Nasıl çalışacağız

Bu bölümün özeti [`../CLAUDE.md`](../CLAUDE.md) dosyasında — her oturumda otomatik okunan hâli orası.

Değişen kural, ve en önemlisi:

> **Eski hâli:** "Kod yazılır ve her anlamlı satırı açıklanır." — bu hâlâ kodu Claude'un yazması
> demek. Yani izlemek. İzleyerek öğrenilmiyor, çünkü takılan sen olmuyorsun.
>
> **Yeni hâli: kavramı Claude anlatır, kodu sen yazarsın.** Ne yazacağın söylenir, satırı sen
> kurarsın, hata alırsın, hatayı beraber okuruz. Daha yavaş ve daha sinir bozucu — ve öğrenmenin
> gerçekten olduğu tek yer.

---

## 15 · Karar günlüğü

### Verildi

| Tarih | Karar |
|---|---|
| 2026-08-11 | **İsim: Rung** — kilitli. (Elenen alternatifler: *Trace*, *Calibre*.) |
| 2026-08-11 | **Koyu + açık tema.** Koyu varsayılan; açık tema ek. Plan v0.1'in "koyu arayüz" maddesini genişletiyor. Bedeli: ikinci palet + o paletin ayrıca doğrulanması, kabaca +2–3 saat. |
| 2026-08-11 | **Kullanıcı hiçbir teknolojiyi bilmiyor varsayılacak.** HTML/CSS/temel JS dışında her şey sıfırdan anlatılır. |
| 2026-08-11 | Tasarım maketi yapıldı — koyu ve açık tema, sağ üstten değişiyor. (Dosya sonradan `design/product.html` oldu.) |
| 2026-08-11 | Tema jetonları tek dosyada: `design/theme.css`. Renk seçimi göz kararı değil — her iki palet de renk körlüğü ayrımı, normal görüş ayrımı ve yüzeye karşı kontrast testinden geçirildi. |
| 2026-08-11 | **Altıncı bir anlam rengi eklendi: mor = "bu modelden geldi".** K1/K2 katmanları, model kimliği rozeti. Deterministik katmanlar nötr kalıyor. Amaç: modelin nerede devreye girdiği tek bakışta görünsün. |
| 2026-08-11 | **Açık temada "turuncu hata" koyu kırmızı-turuncuya (`#8f2418`) kaydı.** Sebep ölçüm: beyaz zeminde gerçek turuncu ile sarı, kırmızı-yeşil renk körlüğünde ayırt edilemiyordu (ΔE 1.3–3.2, taban 8). Kaydırılmış hâli ΔE 22.1. Koyu temada turuncu (`#f2764a`) olduğu gibi kaldı. |
| 2026-08-11 | Büyük resim sayfası eklendi. (Sonradan `design/roadmap.html` ile değiştirildi.) |

| 2026-08-12 | **`design/` iki dosyaya indirildi:** `product.html` (ürün) ve `roadmap.html` (kısa proje bilgisi + adım adım yol haritası). Eski `mockup.html` ve `overview.html` kaldırıldı — içerikleri bu ikisine taşındı. |
| 2026-08-12 | **Beşinci ekran: Geçmiş.** Eski kayıtlara erişim, arama, bağlama göre süzme, aynı görevin tekrarını işaretleme. Aşama 02'nin kapsamına girdi. |
| 2026-08-12 | **Tipografi:** arayüz **Inter**, büyük başlıklar **Instrument Serif**, veri ve etiketler sistem monospace. İkisi de indirilemezse sisteme düşer, düzen bozulmaz. |
| 2026-08-12 | Yol haritası dokuz aşamadan **79 somut adıma** açıldı. |

### Hâlâ açık

- **Yurtdışı hedefi** — Türkiye'den uzaktan yabancı şirkete mi, taşınmak mı, önce eğitim mi?
  Hedef seviyeyi ve sertifika (IELTS/TOEFL) gerekip gerekmediğini doğrudan belirliyor.
- **Haftalık gerçek saat.** Takvim buna göre kurulacak; plan aynı kalır, süre değişir.
- **Başlangıç seviyesi.** İlk hafta birkaç kayıtla ölçülecek — tahminle değil.
