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

Beş ekran, beş iş. Koyu ve sakin bir arayüz: ölçüm aleti gibi görünmeli, dil uygulaması gibi değil.
Renk sadece *anlam* taşıdığında — turuncu hata, sarı öneri, gri şüpheli, yeşil onay, mor "modelden geldi".

1. **Yazma** — bağlamı seç, görevi al, yaz. Görev seviyene göre öneriliyor; boş sayfa en büyük caydırıcı.
2. **Analiz** — ana ekran. Bulgular önem sırasında, seviyeye göre sayısı sınırlı, her birinde
   "katılmıyorum", ikinci geçişi geçemeyen bulgu **şüpheli** olarak işaretli ve istatistiğe girmiyor.
   Ekranın altında **analiz hattının kendisi** duruyor: K0'dan K4'e beş katman, hangisinde model
   çalıştığı renkle işaretli. "Yapay zekâ nerede devreye giriyor" sorusu ürünün içinden cevaplanıyor.
3. **Geçmiş** — eski kayıtlara erişim, arama, bağlama göre süzme, aynı görevin tekrarını işaretleme.
   (12 Ağustos 2026'da eklendi — karar günlüğünde.)
4. **İlerleme** — "ilerliyor muyum?" sorusunun veriyle cevabı. Seviye tahmininin **neye dayandığı**
   açıkça gösteriliyor (§06'daki dört K0 ölçüsü). İnatçı kategori, bir sonraki tekrar setinin hangi
   hatadan üretileceğini belirliyor.
5. **Doğruluk panosu** — projenin vitrini. Yanlış alarm, yakalama, altın küme boyutu, kayıt başı
   maliyet, ve **seviye kırılımlı isabet**. Zayıf yer gizlenmez. Altta §07'deki beş savunma.

Çalışan maket: [`design/product.html`](design/product.html)

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
| Veritabanı | **PostgreSQL · Neon** ✔ karar verildi | İlişkisel model gerçekten gerekiyor: kayıt → analiz → bulgu → geri bildirim zinciri. Barındırma Neon'da (bulut) — gerekçe karar günlüğünde. |
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

| 2026-08-12 | **Veritabanı: Neon — bulut PostgreSQL.** Tek veritabanıyla başlanıyor; hem yerelden hem Vercel'den aynı bağlantı dizesi kullanılacak. **Gerekçe:** Aşama 00'ın bitiş kriteri *"canlı adreste açılan sayfa, veritabanına bağlı"* diyor — sadece yerel Postgres bunu karşılayamaz, çünkü Vercel laptopa ulaşamaz. Ayrıca kurulum yükü sıfır ve öğrenilecek tek bir kavram var. **Bedeli, bilerek kabul edildi:** internet olmadan geliştirilemez, ve bir süre geliştirme ortamı canlıyla aynı veritabanını kullanacak. **Elenenler:** sadece yerel Postgres (Vercel erişemez), SQLite (Vercel'de disk kalıcı değil), Supabase (şimdilik gereksiz kapsam), Vercel Postgres (zaten arka planda Neon). |
| 2026-08-12 | Geliştirme ve canlı veritabanını ayırma işi ertelendi. Gerektiğinde **Neon'un dallanma özelliği** kullanılacak — veritabanının kopyasını git dalı gibi çıkarıyor. Muhtemelen Aşama 02, tablolarla oynamaya başlayınca. |

| 2026-08-12 | **`theme.css` ve `theme.js` kaldırıldı; her sayfa kendi CSS ve JS'ini içinde taşıyor.** Kullanıcı kararı — sayfalar tek başına taşınabilir olsun diye. Her sayfaya *sadece kullandığı kurallar* gömüldü (416 / 329 / 342 satır), ölü kurallar atıldı. **Bedeli, bilerek kabul edildi:** jetonlar üç yerde duruyor, bir renk değişirse üç dosya da düzenlenmeli. Her dosyanın başında bunu hatırlatan bir uyarı var. |

| 2026-08-14 | **Proje sonunda PDF çıkarılacak: "Sıfırdan Next.js".** Kullanıcı isteği. Kaynak malzeme aşama ders notları (`docs/lessons/stage-NN.html`) — her aşama bir bölüm. Şartlar: sıfırdan başlasın, detaylı olsun, **eğlenceli ve resimli** olsun, sıkıcı olmasın. **Bunun bugünden itibaren çalışma şekline etkisi:** her ders notuna en az bir diyagram girecek (Aşama 00'daki sahneleme alanı şeması gibi), biçim aşamalar arasında aynı kalacak, ve baskı için açık tema kullanılacak. Üretim: birleşik HTML → Chrome `--print-to-pdf`. **Zamanlama: bütün aşamalar bitince** (Aşama 08 sonu). |

| 2026-08-16 | **Kimlik doğrulama elle yazılacak — hazır kütüphane yok.** Kullanıcı kararı. Dört parça da elle kurulacak: şifre saklama (hash), oturum, çerez, sayfa koruma. **Gerekçe:** projenin ikinci hedefi işe alınabilir geliştirici, ve oturumun nasıl çalıştığı tam olarak burada öğreniliyor; ayrıca Rung'ın ihtiyacı basit — e-posta + şifre, tek oturum. **Sınır:** şifreleme algoritması elle yazılmayacak, hash işi denenmiş bir pakete verilecek. **Elenenler:** Auth.js (ihtiyacımız olmayan sağlayıcı akışlarını getiriyor, şifre saklama ve oturum kapalı kutu kalıyor), Clerk (en hızlısı ama en az öğreteni, üstelik belli kullanıcı sayısından sonra ücretli). |

| 2026-08-18 | **Şifre hash'leme: `bcryptjs`.** Kullanıcı kararı. Salt üretimi, kasıtlı yavaş hash ve karşılaştırma bu pakete veriliyor; `password_hash` sütununa bcrypt'in tek parça çıktısı yazılıyor (salt zaten onun içinde, ayrı sütun yok). **Gerekçe:** saf JavaScript olduğu için Vercel'de native derleme sorunu çıkmıyor — `main` daima çalışır kalsın kuralı; salt'ı kendi yönetiyor; öğrenilecek yüzey iki fonksiyon (`hash`, `compare`). **Bilerek yapılan takas:** argon2 bugün saf teknik olarak daha güçlü (GPU'ya karşı daha dirençli, güncel tavsiye listelerinde önce geliyor) ama native derleme gerektiriyor. Güç değil, dağıtım kolaylığı seçildi. **Elenenler:** argon2 (derleme riski), `node:crypto` `scrypt` (paket yok ama salt üretimi, saklama biçimi ve zamanlama sızdırmayan karşılaştırma elle yazılır — en çok hata yapılabilecek yer). |

| 2026-08-21 | **Çalışma şekli değişti: kodu Claude yazıyor.** Kullanıcı kararı — *"bu projeyi sen bitir, ben ilerde başka bir Next.js projesi yapacağım, full özenle bitir, benim yapmam gereken kısımlara gelince haber ver."* Gerekçe kullanıcının kendi ifadesi: projeye odaklanacak zaman bulunamadı. **Değişen:** adım adım öğretim, onay bekleme, kontrol soruları. **Değişmeyen:** karar günlüğü, her iş biriminde commit, `main` daima çalışır, kararların gerekçeleriyle belgelenmesi. Aşama 00 ve Aşama 01'in ilk dört adımına ait öğrenme kaydı (`docs/learning-log.md`, `docs/book/`) korunuyor. |
| 2026-08-21 | **Oturum: veritabanında saklanan opak jeton (stateful session).** İmzalı çerez (JWT benzeri) elendi. **Gerekçe:** oturum iptal edilebilir olmalı — "her yerden çık" ve şifre değişince oturumları düşürme imzalı çerezle yapılamaz; ayrıca imza anahtarı Vercel paneline ayrıca girilmesi gereken ikinci bir sır demek, jetonla buna gerek kalmıyor. **Ayrıntı:** jetonun kendisi çereze yazılıyor, veritabanına **SHA-256 özeti** yazılıyor — veritabanı sızarsa jetonlar kullanılamaz. Jeton 32 rastgele bayt olduğu için burada yavaş hash gerekmiyor; bcrypt sadece insan seçimi şifreler için. |
| 2026-08-21 | **Form gönderimi: Server Action.** Route Handler (`app/api/.../route.ts`) elendi. **Gerekçe:** kayıt/giriş formu için ayrı bir HTTP ucu tanımlamak, JSON'a çevirip geri okumak gereksiz katman; Server Action aynı işi tek fonksiyonla yapıyor ve JavaScript kapalıyken de çalışıyor (aşamalı iyileştirme). Route Handler'lar ileride gerçekten dışarıdan çağrılan bir uç gerektiğinde açılacak. |

| 2026-08-21 | **Bağımsız denetimde bulunan gerçek hata: Türkçe İ.** JavaScript'te `"İ".toLowerCase()` tek harf değil **iki kod noktası** üretiyor: `i` + U+0307. Yani `İsmail@x.com` ile `ismail@x.com` normalize edildiğinde eşit çıkmıyordu; telefonda otomatik büyük harfle kayıt olan biri ertesi gün giriş yapamayacaktı. **Düzeltme:** `normalizeEmail` artık birleşen noktayı atıyor (`replace(/\u0307/g, "")` + NFKC). `scripts/smoke.mjs`'e regresyon testi eklendi — İ'li adresle kayıt, küçük harfle giriş. Türkçe konuşanlar için yazılan bir üründe bu hatanın canlıya çıkması ciddi olurdu; denetim tam da bunun için yapıldı. |

| 2026-08-21 | **Kayıtlar veritabanı seviyesinde değiştirilemez.** `entries` tablosuna `BEFORE UPDATE` trigger'ı kondu; UPDATE denemesi hata veriyor. DELETE serbest — kullanıcı hesabını silebilmeli. **Gerekçe:** kural kodda dursaydı unutulur, ikinci bir yazma yolu açılır, ve altı ay sonraki "ilerledim" karşılaştırması sessizce yalan söylerdi. Trigger her yoldan geçeni yakalıyor. |
| 2026-08-21 | **Görev seçimi adrese yazılıyor** (`/write?context=daily&task=12`). Rastgele seçim her render'da tekrarlanırsa, doğrulama hatası sonrası kullanıcı karşısında başka bir görev bulur. Adres kalıcı olunca sayfa belirli hâle geliyor; yenilemek ve paylaşmak aynı görevi veriyor. |
| 2026-08-21 | **Sahiplik kontrolü sorgunun içinde.** `WHERE id = ... AND user_id = ...` — önce satırı çekip sonra sahibini kontrol etmek değil. Bulunamayınca 403 değil **404** dönülüyor: hangi kayıt kimliklerinin var olduğu da sızmıyor. Server action'da bağlam istemciden alınmıyor, görevden okunuyor. |
| 2026-08-21 | **Arama `tsvector` + GIN indeksi ile**, `ILIKE '%x%'` değil. Kök buluyor ("agreements" → "agreement") ve kayıt sayısı büyüdükçe yavaşlamıyor. Plan §11 indeksleri Aşama 07'ye bırakmıştı; arama Aşama 02'nin bitiş kriterinde olduğu için indeks de burada geldi. |
| 2026-08-21 | **Tohum veri betikle, migration'la değil** (`npm run seed`). Migration'lar bir kez çalışıp donuyor; içerik ise zamanla değişecek. Betik idempotent: doğal anahtara göre var olanı güncelliyor, olmayanı ekliyor. 5 bağlam × 5 seviye × 2 görev = 50 görev. |

| 2026-08-22 | **Yazım denetimi: `nspell` + `dictionary-en`.** Karar tercihle değil **ölçümle** verildi — `scripts/bench/spell-bench.mjs`, 40 hatalı + 40 doğru kelimelik altın kümede iki adayı karşılaştırıyor. Sonuç: nspell isabet %100, yakalama %100, **yanlış alarm %0**; sistemdeki `/usr/share/dict/words` listesi isabet %62, yakalama %95, **yanlış alarm %57,5** — çekimli hâlleri ("receives", "occurring") ve modern kelimeleri ("email", "website") bilmiyor. Plan §07 ana ölçütü yanlış alarm olduğu için karar tek satıra dayanıyor. |
| 2026-08-22 | **K0 kural seçimi ölçütü: bağlama bakmadan da yanlış olması.** Kurallar listesinde "I am agree", "make a research", "discuss about", sayılamayan isim çoğulları, a/an ses uyumu, tekrarlanan kelime, küçük "i" var; **olmayan** çok şey var — "very" gereksiz mi, ton uygun mu gibi bağlam isteyen her şey K1'e bırakıldı. Yan cümle sayımında "that" bilerek sayılmıyor: iki ayrı işi var ve modelsiz ayrılamıyor, eksik saymak yanlış saymaktan iyi. |
| 2026-08-22 | **Çakışan bulgular tek bulguya iniyor, öncelik sırası sabit.** Cümle başındaki küçük "i" hem "cümle büyük başlar" hem "I her zaman büyük" kuralına takılıyordu ve kullanıcıya aynı harf için iki kart çıkıyordu. Sıra: Türkçe kaynaklı kalıp → sözcük seçimi → dil bilgisi → mekanik → yazım. Gerekçe: bir Türkçe konuşana en çok şeyi anlatan açıklama kazanmalı. |
| 2026-08-22 | **Çeşitlilik ölçüsü MATTR, ham TTR değil.** Ham type-token oranı uzunlukla kaçınılmaz olarak düşüyor ("the" tekrar etmek zorunda), yani 60 kelimelik metinle 200 kelimeliği karşılaştırmak yalan oluyor. MATTR sabit genişlikte pencereyi kaydırıp ortalama alıyor. Birim testi bunu doğruluyor: aynı çeşitlilikteki iki metinden uzun olanın ham TTR'si düşüyor, MATTR'ı düşmüyor. |
| 2026-08-22 | **Kelime bandı listesi elle derlendi, lisanslı bir CEFR listesi değil.** Oxford 3000 ve English Vocabulary Profile'ın kullanım koşulları net olmadığı için ~2.900 kelimelik A1–B2 listesi sıklık ve seviye sezgisiyle yazıldı; listede olmayan kelime C1 sayılıyor. **Bu yaklaşıklık dürüstçe kayıtlı:** seviye tahmini bu listeye dayandığı sürece kesin değil, göstergedir. Lisanslı liste alınırsa tek dosya değişecek (`app/lib/k0/word-bands.ts`). Yanlış yazılmış kelimeler bant ölçümüne girmiyor — yazım hatası kelime bilgisi göstergesi değil. |
| 2026-08-22 | **`nspell` ve `dictionary-en` paketlenmiyor** (`serverExternalPackages`). Sözlük dosyalarını modül yüklenirken diskten okuyorlar ve paketleyici o okumayı kırıyordu. Sunucuda normal Node `require`'ı ile yükleniyorlar. |

| 2026-08-22 | **Model: `claude-opus-5`, yapılandırılmış çıktı ile.** Şema `output_config.format` üzerinden zorlanıyor (zod), yani model serbest metin döndüremiyor — plan §07 ikinci savunma. Düşünme uyarlanabilir (`adaptive`), çaba `medium`: bu iş uzun akıl yürütme değil sabit şemaya dikkatli çıkarım. **Fiyat:** 1M girdi $5, 1M çıktı $25. Kayıt başı tahmini maliyet ~$0,02 — plan §08'deki maket $0,011 diyordu, gerçek sayı daha yüksek çıkacak. İkinci geçiş (K2) eklenince yaklaşık iki katına çıkar. Ucuz modele düşürmek bir **ürün kararı**, ve kullanıcının kararı; Aşama 05'in eval'i iki modeli sayılarla karşılaştırabilecek hâle gelince tekrar bakılacak. |
| 2026-08-22 | **Model konum vermiyor, hatalı metni birebir kopyalıyor.** Modeller karakter sayarken güvenilmez ve yanlış konum bulguyu metnin başka bir yerine çapalar. Konumu biz `indexOf` ile buluyoruz. **Yan faydası uydurmaya karşı en ucuz savunma:** metinde bulunamayan bulgu kullanıcıya hiç gösterilmiyor. Birim testleri hem uydurma hem taksonomi dışı kodun elendiğini doğruluyor. |
| 2026-08-22 | **Anahtar yoksa sahte modele DÜŞÜLMÜYOR.** Sahte sağlayıcı yalnızca `RUNG_FAKE_MODEL=1` ile, bilerek devreye giriyor ve ürettiği kayıt `model_id` alanında `fake-model-v1` yazıyor — sonradan da ayırt edilebilir. Ölçümü olan bir üründe uydurma sonucu gerçek gibi saklamak yapılabilecek en kötü şey. Anahtar yokluğu ayrıca **başarısız koşum olarak da kaydedilmiyor**: o bir model başarısızlığı değil yapılandırma eksiği, ve Aşama 05'in güvenilirlik istatistiğini kirletirdi. |
| 2026-08-22 | **K0 bulguları isteme "bunları tekrar etme" diye giriyor.** Plan §07 üçüncü savunma ("modele sadece yorum gerektiren kısım gider") burada uygulanıyor: yazım hatası ve sabit kalıplar zaten deterministik katmanda bulunduğu için modelin token'ı onlara harcanmıyor. |

| 2026-08-23 | **Model kararı: K1 ve K2 için `claude-sonnet-5`, çaba `low`.** Kullanıcı ölçütü: *"doğru olması önemli ama aşırı maliyetli olmaması da şart."* **Ölçülen sayılar** (`scripts/bench/cost-model.mjs`, girdi 700 token): opus+opus $0,0330/kayıt · sonnet+sonnet $0,0198 · sonnet+haiku $0,0135 · haiku+haiku $0,0066. Ayda 100 kayıtta sırasıyla $3,30 · $1,98 · $1,35 · $0,66. **Gerekçe:** (1) K1 serbest metin üretmiyor — sabit taksonomi, zorunlu şema, konumu bile modelden almıyoruz; kafes dar olduğu için en güçlü modele ihtiyaç azalıyor. (2) K2'yi haiku'ya vermek ayda 63 sent kazandırıyor ama K2 ana ölçütün — yanlış alarmın — bekçisi; bu kadar küçük bir tasarruf için o katmanı zayıflatmak kötü takas. (3) Tek model = tek değişken: Aşama 05'in eval'i "haiku K2 için yeterli mi" sorusunu tek şeyi değiştirerek ölçebilecek. **Asıl bulgu:** maliyeti belirleyen şey model değil **düşünme uzunluğu** — çıktı token'ı girdinin beş katı fiyatta, ve aynı modelde çaba `low`→`high` maliyeti 3,5 katına çıkarıyor. Çaba `low` varsayılan; eval yetersiz derse yükseltilecek. **Karar geri alınabilir:** model ve çaba ortam değişkeninde (`RUNG_K1_MODEL`, `RUNG_K1_EFFORT`), kod değişikliği gerektirmiyor. |

### Hâlâ açık

- **Yurtdışı hedefi** — Türkiye'den uzaktan yabancı şirkete mi, taşınmak mı, önce eğitim mi?
  Hedef seviyeyi ve sertifika (IELTS/TOEFL) gerekip gerekmediğini doğrudan belirliyor.
- **Haftalık gerçek saat.** Takvim buna göre kurulacak; plan aynı kalır, süre değişir.
- **Başlangıç seviyesi.** İlk hafta birkaç kayıtla ölçülecek — tahminle değil.
