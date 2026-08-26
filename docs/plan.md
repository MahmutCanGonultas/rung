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
- **Hedefli tekrar** — kendi hatalarından üretilen alıştırma, aralıklı tekrarla. Asıl hâli
  **yeniden ölçüm**: aynı görevi, aynı seviyede, aynı bağlamda ikinci kez yazmak. Yoğunluk farkını
  ölçüme çeviren tek şey koşulların sabit olması. `/progress` bunu bugün metinde vaat ediyor.
- **Kelime dağarcığı** — kullanmadığın ama seviyene ait olan kelimeler; aktif/pasif ayrımı.
  Küçük ve dürüst hâli (kelime defteri) 24 Ağustos 2026'da geldi; kapsama yüzdesi ve
  "hiç uzanmadığın kelimeler" bilerek dışarıda — gerekçe §15'te.
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

## 14 · Nasıl çalışılıyor

| | |
|---|---|
| **Teslim** | Aşama aşama. Bir aşama **çalışır ve doğrulanmış** hâlde kapanır; bitiş kriteri karşılanmadan sonrakine geçilmez. |
| **Doğrulama** | İddia edilen her şey çalıştırılarak gösterilir: `npm run typecheck`, `npm run build`, `npm test`, `npm run smoke`, ve ekran görüntüsüyle gözle bakmak. "Çalışıyor olmalı" cümlesi kurulmaz. |
| **Dil** | Yorum satırları ve belgeler **Türkçe**. Kod, dosya adı, tablo adı, değişken adı, commit mesajı, dal adı **İngilizce** — istisnasız. |
| **Yorum** | Kod yorumları **neden**i anlatır, neyi değil. §15'teki kararın gerekçesi, uygulandığı dosyada bir cümleyle tekrar edilir. |
| **Git** | Her iş biriminde commit. Conventional Commits. `main` daima çalışır durumda. |
| **Karar** | Teknoloji seçimi dört soruyla açılır — bu ne yapıyor · onsuz ne olurdu · alternatifi neydi · neden bu — ve §15'e **elenenlerle birlikte** yazılır. |

---

## 15 · Karar günlüğü

### Verildi

| Tarih | Karar |
|---|---|
| 2026-08-11 | **İsim: Rung** — kilitli. (Elenen alternatifler: *Trace*, *Calibre*.) |
| 2026-08-11 | **Koyu + açık tema.** Koyu varsayılan; açık tema ek. Plan v0.1'in "koyu arayüz" maddesini genişletiyor. Bedeli: ikinci palet + o paletin ayrıca doğrulanması, kabaca +2–3 saat. |
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

| 2026-08-12 | **`theme.css` ve `theme.js` kaldırıldı; her sayfa kendi CSS ve JS'ini içinde taşıyor.** Sayfalar tek başına taşınabilir olsun diye. Her sayfaya *sadece kullandığı kurallar* gömüldü (416 / 329 / 342 satır), ölü kurallar atıldı. **Bedeli, bilerek kabul edildi:** jetonlar üç yerde duruyor, bir renk değişirse üç dosya da düzenlenmeli. Her dosyanın başında bunu hatırlatan bir uyarı var. |

| 2026-08-14 | **Proje sonunda PDF çıkarılacak: "Sıfırdan Next.js".** Kaynak malzeme aşama notları — her aşama bir bölüm. Şartlar: sıfırdan başlasın, detaylı olsun, **eğlenceli ve resimli** olsun, sıkıcı olmasın. **Bunun bugünden itibaren çalışma şekline etkisi:** her ders notuna en az bir diyagram girecek (Aşama 00'daki sahneleme alanı şeması gibi), biçim aşamalar arasında aynı kalacak, ve baskı için açık tema kullanılacak. Üretim: birleşik HTML → Chrome `--print-to-pdf`. **Zamanlama: bütün aşamalar bitince** (Aşama 08 sonu). |

| 2026-08-16 | **Kimlik doğrulama elle yazılacak — hazır kütüphane yok.** Dört parça da elle kurulacak: şifre saklama (hash), oturum, çerez, sayfa koruma. **Gerekçe:** projenin ikinci hedefi işe alınabilir geliştirici, ve oturumun nasıl çalıştığı tam olarak burada öğreniliyor; ayrıca Rung'ın ihtiyacı basit — e-posta + şifre, tek oturum. **Sınır:** şifreleme algoritması elle yazılmayacak, hash işi denenmiş bir pakete verilecek. **Elenenler:** Auth.js (ihtiyacımız olmayan sağlayıcı akışlarını getiriyor, şifre saklama ve oturum kapalı kutu kalıyor), Clerk (en hızlısı ama en az öğreteni, üstelik belli kullanıcı sayısından sonra ücretli). |

| 2026-08-18 | **Şifre hash'leme: `bcryptjs`.** Salt üretimi, kasıtlı yavaş hash ve karşılaştırma bu pakete veriliyor; `password_hash` sütununa bcrypt'in tek parça çıktısı yazılıyor (salt zaten onun içinde, ayrı sütun yok). **Gerekçe:** saf JavaScript olduğu için Vercel'de native derleme sorunu çıkmıyor — `main` daima çalışır kalsın kuralı; salt'ı kendi yönetiyor; öğrenilecek yüzey iki fonksiyon (`hash`, `compare`). **Bilerek yapılan takas:** argon2 bugün saf teknik olarak daha güçlü (GPU'ya karşı daha dirençli, güncel tavsiye listelerinde önce geliyor) ama native derleme gerektiriyor. Güç değil, dağıtım kolaylığı seçildi. **Elenenler:** argon2 (derleme riski), `node:crypto` `scrypt` (paket yok ama salt üretimi, saklama biçimi ve zamanlama sızdırmayan karşılaştırma elle yazılır — en çok hata yapılabilecek yer). |

| 2026-08-21 | **Çalışma temposu değişti: aşama aşama teslim.** Adım adım ilerleme yerine, her aşama çalışır ve doğrulanmış hâlde kapanıyor. **Değişmeyen:** karar günlüğü, her iş biriminde commit, `main` daima çalışır durumda, kararların gerekçeleriyle belgelenmesi. |
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

| 2026-08-23 | **Model kararı: K1 ve K2 için `claude-sonnet-5`, çaba `low`.** Ölçüt: doğruluk önemli, ama maliyet aşırı olmamalı. **Ölçülen sayılar** (`scripts/bench/cost-model.mjs`, girdi 700 token): opus+opus $0,0330/kayıt · sonnet+sonnet $0,0198 · sonnet+haiku $0,0135 · haiku+haiku $0,0066. Ayda 100 kayıtta sırasıyla $3,30 · $1,98 · $1,35 · $0,66. **Gerekçe:** (1) K1 serbest metin üretmiyor — sabit taksonomi, zorunlu şema, konumu bile modelden almıyoruz; kafes dar olduğu için en güçlü modele ihtiyaç azalıyor. (2) K2'yi haiku'ya vermek ayda 63 sent kazandırıyor ama K2 ana ölçütün — yanlış alarmın — bekçisi; bu kadar küçük bir tasarruf için o katmanı zayıflatmak kötü takas. (3) Tek model = tek değişken: Aşama 05'in eval'i "haiku K2 için yeterli mi" sorusunu tek şeyi değiştirerek ölçebilecek. **Asıl bulgu:** maliyeti belirleyen şey model değil **düşünme uzunluğu** — çıktı token'ı girdinin beş katı fiyatta, ve aynı modelde çaba `low`→`high` maliyeti 3,5 katına çıkarıyor. Çaba `low` varsayılan; eval yetersiz derse yükseltilecek. **Karar geri alınabilir:** model ve çaba ortam değişkeninde (`RUNG_K1_MODEL`, `RUNG_K1_EFFORT`), kod değişikliği gerektirmiyor. |

| 2026-08-23 | **Seviye tahmini dört K0 sinyalinden, ağırlıklı.** Kelime bandı %25 · cümle karmaşıklığı %25 · hata yoğunluğu %20 · **hata türü %30**. En yüksek ağırlık hata türünde, çünkü plan §06 onu "en belirleyicisi" diye işaretliyor: temel gramer hatası mı, nüans hatası mı. Hata yoğunluğu **ters yönlü** (az hata = yüksek seviye). Hiç sınıflanabilir hata yoksa "hata türü" sinyali nötr kalıyor — hatasız olmak tek başına C1 demek değil, A1 de kısa ve doğru cümle kurabilir. **Eşik tablosu bir tahmin** ve gerçek kullanıcı verisi biriktikçe düzeltilecek; tek dosyada (`app/lib/k3/estimate.ts`) ve okunabilir hâlde duruyor. |
| 2026-08-23 | **Tahminler zaman serisi, üzerine yazılmıyor.** `level_estimates` her kayıttan sonra yeni satır alıyor. Gerekçe plan §06: "ilerleme dediğin şey bu bandın kaymasıdır" — geçmiş tahminler silinirse çizilecek grafik kalmıyor. Ham skor (0–4) da saklanıyor: B1'den B1'e ama 1,6'dan 1,9'a çıkmak da ilerleme, bant değişmese bile. |
| 2026-08-23 | **Bulgu süzmesinde iki ayrı eleme var ve ayrı gösteriliyor.** Öncelik 0 = bu seviyede gürültü; sınır aşımı = önemli ama sıraya girmedi. Karıştırılırsa kullanıcı "bu seviyede önemsiz" ile "bugünlük bu kadar" arasındaki farkı göremez. Gösterim sınırı A1'de 3, C1'de 12 — plan §04: "A1'in cümlesinde on hata vardır; onuncusunu da yüzüne vurursan uygulamayı siler." **Türkçe kaynaklı hatalar her seviyede öncelikli** kalıyor: ürünün ayırt edici tarafı ve üst seviyede de kaybolmuyorlar. |

| 2026-08-23 | **İlk gerçek ölçüm koşumu ve iki düzeltme.** `claude-sonnet-5` · prompt v1 · çaba low · K1+K2, 41 örnek. **İlk sonuç:** isabet %84,4 · yakalama %90,5 · **yanlış alarm %15,6** · kayıt başı $0,0099. Teşhis iki hata gösterdi ve ikisi de düzeltildi. |
| 2026-08-23 | **Ölçüm aracının kendisinde hata vardı — harness yalnızca K1'i puanlıyordu.** Ama K0 hataların çoğunu zaten buluyor ve K1'e "bunları tekrar etme" diye söyleniyor; sonuçta K0'ın bulduğu her hata "kaçırıldı" sayılıyordu. Yakalama %50 görünürken gerçekte %100'dü. **Düzeltme:** harness artık kullanıcının gördüğü şeyi ölçüyor — K0 + doğrulanmış K1, uygulamanın kendi birleştirme mantığıyla. K3 (seviyeye göre süzme) bilerek dışarıda: o "bu kullanıcıya ne gösterilmeli" sorusunu cevaplıyor, ölçülen ise "sistem hatayı buldu mu". **Ders:** ölçüm aracı da ölçülmeli; ilk gerçek koşum olmasa bu sayılar aylarca yalan söylerdi. |
| 2026-08-23 | **İki sözlük: Amerikan + İngiliz.** İlk koşumdaki yedi yanlış alarmın **beşi** İngiliz yazımıydı — `neighbours`, `favourite`, `behaviour`, `generalising`, `judgement`. Hepsi doğru yazılmış; sözlük Amerikan olduğu için hata sanılıyordu. C1'de yanlış alarm %42,9'a çıkmıştı, çünkü ileri seviye metinler İngiliz yazımına daha çok kayıyor. **Karar:** kelime iki sözlükten birinde varsa doğru sayılıyor. Ürünün işi yazım *varyantı* seçmek değil, gerçek hatayı bulmak. |
| 2026-08-23 | **Düzeltmelerden sonra:** isabet %95,1 · yakalama %95,1 · **yanlış alarm %4,9** · kayıt başı **$0,0096**. C1'de yanlış alarm %42,9 → **%0**. Kalan iki yanlış alarm tartışmalı ("funny"→"fun", "fair for"→"fair to") — model haklı da olabilir. Kalan zayıf yer C1 yakalaması (%66,7) ve panoda gizlenmiyor. |

| 2026-08-23 | **Toplulaştırma veritabanında, kodda değil.** `count`, `sum`, `date_trunc` ve `FILTER` sorgunun içinde. Alternatifi bütün kayıtları çekip JavaScript'te saymaktı — altı ay sonra 500 kayıt × ~10 bulgu = 5.000 satırı ağdan geçirmek, aynı sonuç için. Aynı ilke N+1'i de kapatıyor: her kaydın bulgularını ayrı sorguyla çekmek yerine tek JOIN. **Ölçüldü:** 7 aylık veriyle (24 kayıt, 150 bulgu) ilerleme sayfası **1,4 saniyede** açılıyor. |
| 2026-08-23 | **İlerleme sayıları 100 kelimede oran olarak.** Ham sayı yanıltıyor: ilk ay 200 kelime yazıp bu ay 2.000 yazan biri "daha çok hata yapıyor" görünürdü. Grafikler sunucuda SVG olarak çiziliyor — veri zaten sunucuda ve iki basit grafik için tarayıcıya çizim kütüphanesi indirmek gereksiz; sayfa JavaScript olmadan da eksiksiz görünüyor. |

| 2026-08-23 | **CI'da model çağrısı ve gerçek veritabanı YOK.** Her push'ta tip kontrolü, birim testleri ve üretim derlemesi koşuyor. Duman testi ve ölçüm koşumu elle çalıştırılıyor. **Gerekçe:** ikisi de gerçek anahtar istiyor — CI'ya anahtar koymak her push'ta ücret ödemek ve sızıntı yüzeyini büyütmek demek. Derleme veritabanı bile istemiyor, çünkü `db()` tembel: bağlantı ilk sorguda kuruluyor. |
| 2026-08-23 | **Modelin çıktısı test edilmiyor, ÖLÇÜLÜYOR.** Birim testi deterministik şeyler için: ayrıştırma, ölçüm, taksonomi doğrulama, seviye eşikleri, çakışma eleme, isabet/yakalama hesabı. Modelin ne diyeceği olasılıksal — ona birim testi yazmak yeşil kalması için testi zayıflatmak demek olurdu. Onun yeri altın küme ve `eval_runs`. |
| 2026-08-23 | **İngilizce içerik `lang="en"` ile işaretli.** Sayfa Türkçe (`lang="tr"`) ama görev metni, yazma alanı ve bulguların düzeltmeleri İngilizce. İşaretlenmezse ekran okuyucu İngilizce kelimeleri Türkçe telaffuzla okuyor — bu üründe, metnin yarısı İngilizce olduğu için ciddi bir kusur. |

| 2026-08-24 | **Maliyet ürün ekranlarından tamamen kaldırıldı.** Dört yerde dolar rakamı vardı: doğruluk panosunda "kayıt başı maliyet" karosu, kayıt detayında model satırı, vitrindeki kanıt ızgarası ve anasayfada "maliyeti sıfır" cümlesi. **Gerekçe:** bir kaydı analiz etmenin kaç dolar tuttuğu ürünü *işleten* kişinin sorunu; ürünü *kullanan* kişinin ekranında yeri yok. Sayı kaybolmadı — `analyses.cost_usd` ve `eval_runs.cost_usd` duruyor, `npm run eval` çıktısı yazıyor, §15'teki model kararı ölçülen fiyatlarıyla duruyor. Boşalan iki yere **daha iyi** sayılar geldi: doğruluk panosunda "en zayıf seviye", vitrinde "altın küme boyutu" — ikincisi diğer üç sayının neye dayandığını söylüyor. |
| 2026-08-24 | **Hareket tasarımının tek kuralı: temel CSS daima bitmiş kare.** Giriş ekranı "tek düze" diye geri geldi. Eklenen hareketlerin hepsi ürünün kendi işini gösteriyor — metni tarayan okuma kafası, tek tek işaretlenen hata aralıkları, sırayla yanan beş katman, ölçülen orana dolan çubuk, kendi kendini düzelten başlık. Süs hareket **eklenmedi** ve öneriler arasından elendi (ölçek çizgisi zemini, cetvel çentikleri, kaydırma ilerleme çubuğu): ölçmediği bir şeyi çizen grafik, bu ürünün tam karşısında durduğu şey. **Sayı sayacı da elendi** — sıfırdan yukarı sayan sayaç, yarım saniye boyunca ekranda ölçülmemiş sayı göstermek demek. Yerine orantılı çubuk: %4,9 gerçekten hücrenin %4,9'unu kaplıyor. **Uygulama kuralı:** bütün keyframe kuralları `[data-play]` altında, hiçbir yerde korumasız `opacity: 0` yok. JavaScript inmezse, gözlemci çalışmazsa, kullanıcı hareketi kapatmışsa sayfa eksiksiz. `prefers-reduced-motion` bloğu `animation-delay`i de sıfırlıyor — etmeseydi hareketi kapatan kişi en kötü deneyimi yaşardı (süre 0,01 ms ama gecikme 1,2 sn). |
| 2026-08-24 | **Kelime defteri: `word_notes`, kaynağına çapalı.** Plan §12'deki "kelime dağarcığı" maddesinin küçük ve dürüst hâli öne alındı. Not üç yerden alınıyor ve üçü de bilinmeyen kelimenin gerçekten ortaya çıktığı yerler: görev metnindeki üst bant kelimeleri, Rung'ın önerdiği kelime, kendi yazdığın bantta olmayan kelime. **Elenenler ve sebepleri:** `user_lexicon` + kapsama yüzdesi (paydası elle derlenmiş ~2.900 kelimelik liste — ürünün en kesin *görünen* sayısı en zayıf temele otururdu), "hiç uzanmadığın kelimeler" listesi (kullanıcı o kelimeleri metnine sıkıştırır; alet ölçtüğü şeyi bozar), dönüşüm istatistiği (gerçek lemmatizer olmadan `reluctant`→`reluctantly` kaçar, yanlış oran hiç orandan kötü), altıncı ekran (§08 "beş ekran, beş iş" bir kapsam kararı — defter mevcut panoya bölüm olarak girdi). **Dürüstlük kuralı:** liste kullanıcının kendi işaretlediklerinden oluşuyor ve ekran bunu yazıyor — Rung "bunu bilmiyorsun" diye bir ölçüm yapmıyor. `C1` ekranda "listede yok" diye gösteriliyor, "ileri seviye" diye değil. Bant istemciden gelmiyor, sunucuda `bandOf()` ile hesaplanıyor; sahiplik `INSERT … SELECT … JOIN` zincirinde kanıtlanıyor. |
| 2026-08-24 | **Logo, aletin kendi ölçeği.** "Rung" İngilizcede merdiven basamağı demek ve ürün seviye ölçüyor — glif beş basamak: A1, A2, B1, B2, C1. En üst basamak vurgu renginde: ölçüm hep bir sonraki basamağa bakıyor. `currentColor` ile çiziliyor, iki temada da ayrı kural gerekmiyor. Aynı glif sekme ikonu; orada dolu karo, çünkü şeffaf ikon açık sekme çubuğunda kayboluyor. |
| 2026-08-24 | **Üç ekran, çalışan bir özelliği "yakında geliyor" diye anlatıyordu.** Yaz ekranı "Analiz henüz yok — Aşama 03 ve 04'te geliyor", kayıt detayı "model katmanında gelecek", pano "sıradaki aşama: deterministik katman". Üçü de aylar önce çalışmaya başlamıştı, ve ikisi iç yol haritası numaralarını kullanıcıya sızdırıyordu. **Ders:** ürün metni de kod kadar bayatlıyor ve kimse onu derlemiyor. |
| 2026-08-24 | **Dört grafik sonucu olduğundan iyi gösteriyordu.** (1) Hata ailesi çubukları her satırı KENDİ maksimumuna göre çiziyordu: aynı değerde biten iki aile farklı uzunlukta çubuk alıyordu. Ortak ölçek + başlangıç izi geldi. (2) "İnatçı kategoriler" tüm zamanların toplamına göre sıralıyordu, yani aylar önce çözülmüş kategori "bunu çalış" listesinin başındaydı; artık son 30 güne göre, ve hiçbiri tekrarlamadıysa ekran bunu söylüyor. (3) Doğruluk ekranı yalnızca isabeti çiziyordu — yakalaması %66,7 olan C1 tam yeşil ve bayraksız görünüyordu, yani sayfa tam da gizlememeye söz verdiği şeyi gizliyordu. İki ölçüt de çiziliyor, bayrak hangisinin bozulduğunu söylüyor. (4) `recentRuns` sahte model koşumlarını da alıyordu ve ekran en son koşumu manşete koyuyor: tek bir `--fake` koşumu ilan edilen doğruluğu taklit modelin sayılarına çevirirdi. Ayıklandı, ve ekran ayıkladığını yazıyor. |
| 2026-08-24 | **İtiraz sayacı yanlış sayı gösteriyordu.** `disagreementCount()` filtresiz `agreed = false` sayıyordu ama ekran "bekleyen itiraz" diyordu — asla düşmeyen bir bekleyen sayacı, üstelik altın kümeye çoktan alınmışları da sayıyor. Ad `objectionCount`, etiket "itiraz kaydedildi" oldu. Beşinci savunmanın metni de düzeltildi: itirazlar altın kümeye **kendiliğinden** girmiyor, `npm run gold:from-feedback` ile elle gözden geçirilip ekleniyor. Elle kalması bilinçli — bütün doğruluk iddiasının dayandığı tek veri kümesinde insan kararı doğru bekçi. |
| 2026-08-24 | **Ekran görüntüsü aracı sessizce yanlış bakıyordu.** Görüntüler hareketin ilk karesinde donuyordu: işaretsiz hata aralıkları, boş sayılar — yani "ürün bozuk" gibi. Üç ayrı sebep vardı. (a) Giriş yapmış/yapmamış diye iki sekme kullanılıyordu; Chrome arka plandaki sekmede CSS animasyonlarını **ve** `requestAnimationFrame`i askıya alıyor. (b) `bringToFront()` çözmedi. (c) Bekleme hidrasyondan önce koşuyordu, yani `finish()` henüz var olmayan animasyona işliyordu. **Çözüm:** tek sekme (önce çerezsiz sayfalar, sonra giriş) ve görüntüler `prefers-reduced-motion` açıkken çekiliyor. İkincisi kolaylık değil, asıl doğrulanması gereken durum: bir bilgi yalnızca harekete emanet edilmişse o görüntülerde eksik görünür. **Ders, tanıdık:** ölçen araç da ölçülmeli. |

| 2026-08-24 | **Aynı günün işi düşmanca gözden geçirildi; on bir kusur ayakta kaldı, yirmi dördü elendi.** Ağırlıklı olanlar ve düzeltmeleri: **(1) `word_notes` çapa kısıtı yabancı anahtarlarıyla çelişiyordu** — `ON DELETE SET NULL` ile `NOT NULL` isteyen bir `CHECK` yan yana duruyordu; Postgres SET NULL'ı UPDATE olarak uyguladığı için bir kaydı, analizi ya da bulguyu silmek **imkânsızdı**. Gerçek bir kümede yeniden üretildi. Patlamamasının tek sebebi hiçbir kod yolunun bunları silmiyor olmasıydı — hata gizliydi, yok değil. 0009 ile kısıt tutarlılığa çevrildi: not kaynağı silinse bile kalıyor, ki `notes.ts` zaten bunu varsayıyordu. **(2) Başlığın üstü çizgisi telefonda hiçbir şeyin üstünü çizmiyordu** — mutlak konumlu `::after`, başlık iki satıra kayınca iki satırın arasındaki boşluğa düşüyordu (470px altında, yani her telefonda) ve bu hareketin geçici karesi değil kalıcı hâliydi. Arka plan çizgisi + `box-decoration-break: clone` ile her satır parçası kendi çizgisini alıyor. Ölçerken ikinci bir kusur çıktı: `line-height: 1.03` fazla sıkıydı, ikinci satırın dalgalı çizgisi "Ölç."in kutusuna giriyordu. **(3) Logonun tek fikri tersine dönmüştü** — kök `<svg>` üzerindeki `opacity: .32` çocuklara ÇARPILIYOR, yani üst basamağın `opacity: 1`i hiçbir şey yapmıyordu; vurgu rengi koyu temada dört komşusundan daha sönük çıkıyordu. Saydamlık basamaklara taşındı. **(4) Bağlam cümlesi kelimeyi içermeyebiliyordu** — elle eklenen kelimede görev metni, öneriden gelen notta bulgunun TÜRKÇE açıklaması bağlam diye saklanıyordu, üstelik ekran bağlamı `lang="en"` ile işaretliyor. Tek kural ikisini de kapattı: cümle kelimeyi içermiyorsa bağlam yok. **(5) Vitrindeki "Altın küme" o koşumun örnek sayısıydı**, kümenin bugünkü boyutu değil; `--limit` ile koşulmuş ya da sonradan büyümüş bir kümede ikisi ayrışıyordu ve aynı Türkçe başlık iki ekranda iki farklı sayı gösteriyordu. "Ölçülen örnek" oldu. **(6) "Üçte biri hatasız" yanlıştı** — 18/41, yani %43,9; hiç doğru olmamış, ilk günden yanlış. **(7) `Band` ile `Level` aynı beş değerdi ama aralarında hiçbir bağ yoktu**; birine C2 eklense diğeri sessizce ayrışır, kod derlenmeye devam eder ve "senin bandının üstünde şu kelimeler var" yanlış cevap verirdi. Derleme zamanı iddia + birim testi eklendi. **Ders:** bugünün işi test edilmiş, ölçülmüş ve gözle bakılmıştı — yine de yedi gerçek kusur kaldı. Kendi işini gözden geçirmek, gözden geçirmek değil. |

| 2026-08-24 | **Giriş ekranının YAPISI değişti — cila reddedildi.** Ölçülen sorun: form ekranın %9,9'unu kaplıyordu, sol sütunun %76'sı boştu, ve o boşluk tasarlanmış değildi — 380px'lik bir kutuyu 600px'lik bir sütunda ortalayan `margin-block: auto`nun artığıydı. Başlık 28px'ti, yani yanındaki `.proof-value`dan (29px) küçüktü: kapının adı, reklamın sayısından daha sessizdi. Ve 100dvh boyunca uzanan dikişi hiçbir öğe geçmiyordu, o yüzden göz yan yana iki ayrı ürün görüyordu. **Yeni yapı tek levha:** analiz sayfanın zemini (kenardan kenara), form o zeminin üstünde duran ve üst kenarını kıran yükseltilmiş bir nesne, beş gerçek bulgu kartın altından tam genişlikte geçiyor (sol kenarı KARTIN kenarı, sağ kenarı SAYFANIN kenarı), ölçülen doğruluk en altta aletin durum çubuğu gibi. Kompozisyon üstte ayrık, altta sürekli — dikiş artık çizilemiyor. **Yeni tek şey `Proof`un bant çubukları:** `Mark.tsx` beş yükselen basamak çiziyor (A1…C1) ve artık o basamakların boyu sabit değil, her biri o seviyede ÖLÇÜLEN yakalama; C1 kısa çıkıyorsa sebebi tasarım değil son koşum. Çizim takımı ödünç değil — `.meter-*` zaten Doğruluk ekranında tam olarak bu niceliği çiziyordu; aynı şey için beşinci bir çubuk dili yazılmadı. **Elenenler:** 62px başlık (ölçüm aletinde en yüksek sesli şey kapının adı olamaz), JetBrains Mono (`--mono` kırk kuralda taşıyıcı — giriş biletinin altında bütün ürünün yapısal yüzü değişmez), saydam kenarlıksız girdi (`forced-colors`da kayboluyor, Safari otomatik doldurmada satırı yeniden boyuyor), `auto-fit` raf (900–1250px arasında 3+2 kırıyordu — 13" dizüstü tam orada), ve ortalanmış panel (yanlış şifre `.form-error`u ekleyince bütün sayfa 22px yukarı kayıyordu, hem de kullanıcının yeniden yazacağı alan dâhil). **Telefonda artık hiçbir şey gizlenmiyor.** Eski `display: none` kuralının gerekçesi ("giriş yapmak ikna olmaktan önce gelir") SIRA hakkındaydı ve doğruydu — ama kanıt o zaman GENİŞLİK için yarışıyordu. Tek sütunda yarışmıyor: kart hâlâ tam genişlikte, hâlâ katlamanın üstünde, DOM'da ilk, e-posta odakta. **Yan kazanç:** `.auth` ve `.auth-card` sınıflarının bugüne kadar HİÇ kuralı yokmuş — `/error` ve `/not-found` aylardır tamamen çıplak çıkıyormuş. |

| 2026-08-24 | **Her metnin kendi seviyesi artık görünüyor — hesap zaten vardı, gösterimi yoktu.** `estimateLevel` kayıt anında O METNİN kendi K0 sinyallerinden çalışıyor ve sonuç `level_estimates` tablosuna **`entry_id` ile** yazılıyordu; ama tablo yalnızca `latestEstimate(userId)` ile, yani "kullanıcının güncel seviyesi" olarak okunuyordu. "Şu metin hangi seviyedeydi" sorusunun cevabı aylardır veritabanındaydı ve hiçbir ekranda yoktu. Eklenen: `estimateForEntry(entryId, userId)`, kayıt sayfasında dört sinyaliyle tam kart, ve geçmiş listesinde satır başına bant rozeti — altı aylık liste artık A2 → B1 → B2 yükselişini hata yoğunluğunun düşüşüyle yan yana gösteriyor. **Ayrım yazıldı:** kayıt sayfasındaki eski etiketsiz "B1" rozeti artık `Görev B1`, çünkü GÖREVİN zorluğu ile METNİN ölçümü iki ayrı şey ve ikisi yan yana durunca etiketsiz olan yalan söylüyor. **Ölçülmemiş kayıt uydurulmuyor:** tahmin motorundan önce yazılmış ya da o koşumu patlamış kayıtlarda rozet hiç çizilmiyor ve sayfa "ölçülmedi" diyor; güvenilmez tahminin rozeti kesikli çerçeveli. **Doğrulama:** bilerek basit ve hatasız bir metin yazıldı ("I have a cat. The cat is big…") ve **A2** ölçüldü — kelime bandı A1, karmaşıklık A1, hata yoğunluğu C1. Yani hatasız olmak tek başına yüksek seviye vermiyor; §15'teki "A1 de kısa ve doğru cümle kurabilir" kararı gerçekten böyle davranıyor. |

| 2026-08-24 | **Anasayfa yapıdan değişti: altı hamle, tek ray — ve sayfanın kanıtı artık bir OLAY.** Ölçülen sorun: `.land` 980px'lik bir kutuydu, altı bölümün altısı da aynı genişlikte, aynı `display`te, aynı zemindeydi ve hiçbiri kenara değmiyordu; 2693px'in 925'i tek bir kartın içindeydi; sayfada sadece iki punto vardı (68 ve 25). Yani kompozisyon değil, listeydi. Üstelik **giriş ekranı anasayfadan daha moderndi** — vitrin kapıdan geride kalmıştı. **Yeni yapı:** her şerit kendi ızgarası ama rayları ortak, böylece dikey çizgiler sayfa boyunca hizalı kalırken zemin, genişlik ve tempo şeritten şeride değişiyor. Zeminler dönüşümlü: plane → surface → plane → surface → plane. **Dayanak noktası:** aynı K0 motoru DOĞRU bir cümlede sıfır bulgu veriyor ve sayfa iki cümleyi yan yana koyuyor — 5 bulgu ile 0 bulgu. Ürünün kanıtlanamaz iddiası ("bir hatayı kaçırmak telafi edilir, doğru bir cümleyi düzeltmek edilmez") cümle olmaktan çıkıp sayfanın render anında hesapladığı bir olaya dönüşüyor. `showcase.test.ts` iki sayıyı da kilitliyor: bir kural değişip motor doğru cümleye takılırsa vitrin sessizce yalan söylemiyor, `npm test` düşüyor. **Tipografi:** sekiz basamak, ve en büyük şey artık ölçülen sayı — `%4,9` 108px, başlık 82px. Bir ölçüm aletinde en yüksek sesli şey sloganın değil ölçümün olması bir tercih değil, argümanın kendisi. **Hareket onarımları:** dört ayrı nesne türü (bulgu kartı, sayaç, ölçülen değer, künye) aynı `fade-rise` ile beliriyordu — yani her yerde görülen o kaydırma efekti; her birine kendi fiili verildi. `layer-arm`ın `opacity: 0.28`i silindi: 11,5px `--ink-3` metni 1,6 saniye boyunca okunabilirlik eşiğinin altında tutuyordu. Hattın ışığı telefonda `display: none` ile siliniyordu — artık 90° dönüyor. **Elenenler:** yapışkan üst çubuk (gezinmesi olmayan bir sayfada 2021 kalıbı, üstelik her şerit kendi zeminini boyadığı için üzerine oturmuyor), 104px başlık (ölçülen sayıyı ikinci plana atardı, ayrıca 1.03 satır yüksekliği bu dosyada zaten ölçülüp reddedilmişti), `--beat`in `:root`a çıkarılması (`.auth-stage` o jetonları okuyor, dün imzalandı — `.land`e kapsandı), önceki koşumun hayalet çubuğu (açıklanmayan bir fark, üstelik ikinci bir sorgu). |

| 2026-08-25 | **Anasayfa düşmanca gözden geçirildi: 28 iddianın 15'i ayakta kaldı, 13'ü elendi.** Ağırlıklı olan ikisi ve düzeltmeleri: **(1) Başlığın dalgalı çizgisi "Ölç."ün Ö harfinin iki noktasının ARASINDAN geçiyordu** — yani düzeltmenin kabul edildiğini gösteren kelimenin üstü hata rengiyle çiziliyormuş gibi duruyordu, anlamın tam tersi. 4× büyütmede gözle doğrulandı. Ölçek bağımsız olduğu için 360'tan 1440'a her genişlikte oluyordu, telefona özgü değildi. Daha kötüsü: `line-height: 1.09`un yanına **"ölçüldü" diye not düşülmüştü ve ölçülmemişti** — bu dosyada aynı sınıftan bir hata ikinci kez oluyor. 1.24 ile düzeldi ve bu sefer altı genişlikte ölçüldü. **(2) `.claim-actions { grid-row: 4 }` çıplak yazılmıştı** ve kapanış bandının düğmesini de 4. satıra çakıyordu: DOM'da başlıktan sonra, nottan önce duruyor ama EKRANDA notun altına düşüyordu. Görsel sıra ile okuma sırası ayrışınca klavyeyle gezen kişi başka bir sayfa geziyor demek. **Diğerleri:** hattın 2px'lik izi ≤820px'de metinle aynı x'te başlıyor ve "K0"ın dikey gövdesini kapatıyordu; iki sütunlu hatta metin sütunları hiç boşluk bırakmadan yan yana geliyordu; zorlanmış renklerde `.proof-cell.is-lead .proof-fill` (0,2,0) düzeltme kuralını (0,1,0) yenip ana ölçütün çubuğunu görünmez bırakıyordu; `sup { display: inline-block }` temel duruma sızmıştı. **Ve jeton düzeyinde bir bulgu:** `--ink-3` mikro metinleri en açık zeminde **3,05:1**'de bırakıyordu, okunabilirlik alt sınırı 4,5:1 — ve o jeton ürünün her yerinde 9–13,5px metin taşıyor (alan etiketleri, koşum künyeleri, bant rozetleri). İki ekranda yerel olarak `--ink-2`ye yükseltilerek yamanmıştı; asıl sebep jetonun kendisiydi. Üç tema bloğunda da düzeltildi, dört zeminde ölçüldü: artık 4,03–5,83. **Süreç dersi:** bu oturumda üç kez bir `replace` sessizce boşa gitti (hedef metin başka bir düzenlemeyle değişmişti) ve bir kez commit mesajı yapılmamış bir işi yapıldı diye yazdı. Artık her düzenleme dosyaya yazıldıktan SONRA `assert` ile doğrulanıyor. |

| 2026-08-25 | **Zayıf yer vitrinden kaldırıldı — §08 kısmen geri alındı.** Ürün sahibinin kararı: "zayıf yeri sen ben bilsek yeter, tüm kullanıcıların görmesine gerek yok." Anasayfadan ve giriş ekranından hem `Zayıf yer gizlenmiyor: C1 %66,7` cümlesi hem bant başına yakalama çubukları kalktı (C1 kırmızı ve kısa çıkıyordu — o da zayıf yeri göstermenin başka bir yoluydu). **ÖLÇÜM KAYBOLMADI:** seviye kırılımı Doğruluk ekranında tam hâliyle, `eval_run_levels` tablosunda ve `npm run eval` çıktısında duruyor; değişen tek şey ilk karşılaşma. **Karşı görüş kayda geçsin:** §08'in "zayıf yer gizlenmez" maddesi bu ürünün en ayırt edici tarafıydı ve ölçülen yanlış alarmını yayımlayıp en kötü sayısını da yanına koyan başka bir araç yok. Madde ürünün kendi panosu için geçerliliğini koruyor, yalnızca tanıtım yüzeyi için geri alındı. README de buna göre düzeltildi — "gizlenmiyor" iddiası artık yalnızca Doğruluk ekranı için yazılı. |
| 2026-08-25 | **Başlıktan hata dilbilgisi kaldırıldı.** "İngilizceni tahmin etme."nin üstü çiziliyor ve altına hata rengiyle dalgalı çizgi geliyordu — ürünün kendi düzeltme grameri kendi başlığına uygulanıyordu. İki sebeple kalktı: (1) sayfaya ilk bakan kişi o kırmızı çizgileri **ürünün kendi hatası** sanabiliyordu, (2) dalga "Ölç."ün noktalarına giriyordu ve düzeltmenin kabul edildiğini gösteren kelime, hata rengiyle çizilmiş gibi duruyordu. Yerine ölçü ve ağırlık karşıtlığı: öncül 34px / ağırlık 420 / sessiz renk, fiil 82px / ağırlık 680 / vurgu rengi. Süs yok, kontrastın tamamı tipografiden. `hero-flag`, `hero-strike`, `hero-accept` keyframe'leri ve `.hero-em` sınıfı silindi; satır aralığı sorunu da kendiliğinden gitti. |

| 2026-08-25 | **Giriş ekranı üçüncü kez, sıfırdan: KAPI.** İki tasarım reddedildi ve ikisinin de kusuru aynıydı — sert, soğuk, geniş boş alanlı bir alet panosu. Bu sefer karar SICAKLIK: kâğıt zemin, tuvalin dışından tek bir ışık, okunacak yerlerde kitap yüzü (Source Serif 4; Türkçe kapsaması `font-data.json`dan diskten doğrulandı). **Ekran artık ürünü ANLATIYOR:** beş adım, ve her adımın yanında iddiayı kanıtlayan canlı bir şey — K0'ın o sayfa çizilirken bulduğu beş bulgu, taksonominin yirmi bir jetonu, beş katman, kaydın beş alanı, dört sinyal. Hiçbiri cümle değil, hepsi render anında hesaplanıyor. **Katlamanın üstünde tek iş var: form.** Kadran ve cümle onun yanında; ders formdan SONRA başlıyor, çünkü otuzuncu ziyaretinde gelen kişi aşağı hiç bakmıyor. **Kadran süs değil:** çevre ekseni taksonomi (21 alt kategori, 5 aile sektörü; 21 + 5 × 1,4 = 28 birim, çember tam 360,00°'de kapanıyor), yarıçap ekseni A1..C1 **beş eşit** graduation — eşit, çünkü `bandOfScore` 0–4 skoru eşit eşiklerle yuvarlıyor ve eşit olmayan aralık burada yalan olurdu. Vurgu dolgusu yuvarlanmış bandı değil **ham skoru** gösteriyor (0,94 → dolgu 114,6, A2 halkası 116; yani dolgu halkanın bir tık altında duruyor, çünkü skor tam sayı değil). Yanan beş nokta gerçek K0 bulguları. Bir K0 kuralı değişirse takımyıldız değişir, taksonomiye alt kategori eklenirse ışın eklenir. **`--model` (mor) bu çizimde hiç yok:** o jeton "bunu bir model üretti" demek ve burada model yok. `showcase-run.ts` tek analizi kadran, cümle şeridi ve bulgu rafı arasında paylaştırıyor — "kadrandaki nokta ile cümledeki işaret AYNI ölçümden geliyor" iddiası koda dayanıyor, tesadüfe değil. **Fotoğraf istendi, çizim verildi:** "konsepte uygun fotoğraf" istenmişti; indirilen görsel kullanılmıyor (lisansı doğrulanamaz — §14) ve stok fotoğraf zaten ölçmediği bir şeyi gösteren bir görüntü olurdu, ürünün tam karşısında durduğu şey. Kadran o boşluğu ürünün kendi verisiyle dolduruyor. **Elenenler:** telefonda `order` ile kadranı forma taşımak (görsel sırayı DOM sırasından ayırmak, klavyeyle gezen kişiyi başka bir sayfada gezdirmek demek — bu kusur anasayfada bir kez çıkmıştı), ve `.auth-stage` levhasının korunması. **Silinen:** `AuthShell.tsx` ve 366 satır ölü CSS. `.auth`, `.auth-card`, `.auth-title`, `.auth-title-soft`, `.auth-lede`, `.auth-alt` DURUYOR — `/error`, `/not-found` ve kayıt detayı onları kullanıyor. |
| 2026-08-25 | **Kontrast ölçer yazıldı (`npm run contrast`) — ve ölçen araç iki kez yanlış ölçtü.** **(a)** İlk sürüm `getComputedStyle` ile ata zincirinde saydam olmayan ilk zemini arıyordu. **106 kusur bildirdi ve neredeyse hepsi uydurmaydı:** gradyanı, alfa harmanını ve devralınan `opacity`yi göremiyor, hiçbir atasında düz renk bulamayınca zemini SİYAH sayıyordu — 46px'lik başlık "1,16:1" çıkıyordu, oysa ekranda krem üstünde koyu serif duruyor. **(b)** İkinci sürüm hem metni hem zemini pikselden okudu (PNG yerleşik `zlib` ile çözülüyor, yeni bağımlılık yok). Saçma sayılar gitti ama küçük metin sistematik olarak düşük okundu: 10px'lik ince yazıda tırtıklama hiçbir pikseli tam renge boyamıyor, WCAG ise BELİRTİLEN rengi ölçüyor. **(c)** Kalan sürüm melez — zemin pikselden (gradyan, alfa, karışım kipi, üst üste binen katmanlar zaten pikselin içinde), metin rengi CSS'ten, devralınan opaklık ve rengin kendi alfası ölçülen zeminin üstüne harmanlanarak. Ölçüm elemanın kutusunda değil `Range.getClientRects()` ile metnin kendi satır kutularında yapılıyor. **Sonuç: 1466 metin kutusu, üç sayfa × iki tema, üç GERÇEK kusur.** **(1) `--accent` açık temada 3,14:1** — hem butonun beyaz etiketi hem kâğıt üstündeki yeşil metin, taban 4,5. Yani kusur butonda değil JETONDA'ydı. Ton korundu (H=160°, S=%83), HSL parlaklığı %33,1 → %26,0 (`#0e9b6c` → `#0b7a55`); yeni ölçüm 4,73 / 4,73 / 5,08. Koyu temanın `#35d39b`si zaten 10,08, dokunulmadı. **(2) `.dial-legend i`** zaten okunabilir en sessiz mürekkep olan `--ink-3`ün üstüne `opacity: .72` bindiriyordu → 2,85:1. **(3) `.proof-cell.is-lead { background: var(--accent-wash) }` kısayolu `.proof-cell`in opak `--surface`ını siliyordu.** Izgaranın zemini `--hairline` — boşlukları çizgi gibi göstermek için — yani %10'luk yıkamanın altından ÇİZGİ RENGİ geçiyordu: hücrenin gerçek zemini `#c8cec2`, komşularınınki `#f7f5f1`. **Ana ölçütün hücresi, diğerlerinden temiz durması gerekirken yazıldığı günden beri onlardan kirli duruyordu.** `background-image` katmanı ile düzeltildi. **Ders, bu dosyada üçüncü kez:** ölçen araç da ölçülmeli. Bu sefer araç iki tur yanlış ölçtü ve ikisinde de ürün bozuk göründü. |

| 2026-08-25 | **Anasayfanın omurgası: merdiven — ve sayfanın TEK ters düzlemi.** Ürün sahibi iki şey söyledi: kahramanın sağ üstü boş, ve "her şey birbirine benziyor". **Boşluk ölçüldü:** sağ sütun 460px'lik bir hücreydi, içeriği 91px'lik tezdi ve dibe yaslıydı — üstünde ~700×360 tasarlanmamış alan. **Benzerlik de ölçüldü ve his değildi:** `.mech` ile `.measure` BİREBİR aynı beş bildirimi kullanıyordu (başlık solda satır 1, alt metin sağda satır 1, `align-self: end`, aynı `padding-left`), yani şikâyet kopyalanmış bir bloktu. Ve dönüşümlü zeminler görünmüyordu: `--plane` ↔ `--surface` **1,072:1**, oysa bir zemin kenarının kenarlıksız okunması için pratik eşik ~1,15, kaydırırken ~1,25. Sayfadaki hiçbir adım eşiği geçmiyordu. **Boşluğa gelen şey: merdiven.** "Rung" İngilizcede merdiven basamağı ve ürün seviye ölçüyor — logo zaten beş basamak çiziyordu; kahraman aynı beş basamağı sayfanın en büyük nesnesi yaptı. Yeni metafor icat edilmedi, var olan büyütüldü. Basamak sayısı `BAND_ORDER`dan, yanan basamak `estimateLevel`in 600px aşağıdaki örnek cümleye verdiği bant — yani ikon değil OKUMA, ve okuduğu şey aynı ekranda kontrol edilebiliyor. Hacim izometrik SVG: basamak başına üç yüz, soldan sağa boyanıyor ve her basamak bir öncekinin sağ yüzünü kapatıyor — üç boyuttaki örtüşmenin ta kendisi, kütüphane yok. Basamaklar `[data-play]` altında sırayla tabandan yükseliyor; bitmiş kare beşi de tam boyda. **Elenen ve neden:** önce 41 çentiklik bir çetele yapıldı — son koşumun her bulgusu bir çentik, iki yanlış alarm kırmızı. Ölçüt doğruydu ama sağ sütuna altı nesne koyuyordu ve ürün sahibi "karmakarışık" dedi. Sayı tek satır olarak kaldı, alan gitti. **Ters düzlem:** daha çok küçük adım işe yaramayacağına göre tek büyük adım — `.measure` sayfanın tek ters bandı oldu, açık temada **16,2:1**, koyu temada bant aşağı inemediği için yükselen bir levha, **1,40:1**. Bant jetonları KENDİ ALT AĞACINDA yeniden tanımlıyor, böylece var olan bütün `.proof-*` kuralları tek satır değişmeden çalışıyor. **`color` açıkça yazılmak zorunda:** devralma jetonu değil çözülmüş rengi taşıyor, `--ink`i yeniden tanımlamak `body`den gelen mirası değiştirmiyordu — başlık 1,02:1'de kalmıştı. **Üç ayrım daha:** bant kendi eksenini kuruyor (ortalı, tek sütun); duruşma şeridi ölçek sıçraması alıyor — sayfanın en önemli hesaplanmış olgusu, aynı motorun doğru cümlede SIFIR bulgu vermesi, 9,5px mono köşede duruyordu, `5` ve `0` artık bölümün en büyük şeyi; kapanış giriş ekranı için zaten yüklü olan serifle yazılıyor, çünkü bant da ortalı olunca "ortalı olmak" kapanışı tek başına ayırmıyordu. |
| 2026-08-25 | **Kalabalık hissinin kaynağı ölçüldü: `.trial` 925px'te 55 metin bloğu ve 13 çizgili öğe taşıyordu**, komşularının üç katı, ve hem en yüksek hem en yoğun bölümdü. Sebep bulgu SAYISI değildi: beş bulgu iki sütuna bölününce göz aşağı okumak yerine zikzak çiziyordu. Tek sütuna alındı. Asıl delik sağdaki sessiz bölmeydi — `.move` `align-items: start` diyor, bölme kendi içeriği kadar yüksek kalıyordu: ÖLÇÜLDÜ sol 949px, sağ 446px, aradaki 500px bölmenin altında çıplak zemin olarak duruyordu. `align-self: stretch` ile yüzey satırın tamamını kaplıyor ve not ortasında duruyor. **Kural:** boşluk tasarlanmış görünmek zorunda, artık gibi değil. |

| 2026-08-25 | **Merdiven izometrik çizimden GERÇEK üç boyuta geçti.** Ürün sahibi "3B model tarzı olsun, animasyonlu olsun" dedi. İlk sürüm izometrik SVG'ydi — üç boyutlu *görünen* düz bir çizim; örtüşmeyi boyama sırası çözüyordu, yani model dönemezdi. Yeni sürümde her basamak `transform-style: preserve-3d` ile kurulmuş beş yüzlü bir kutu, sahnenin `perspective`i var ve derinlik sırasını tarayıcı hesaplıyor: model dönerken yüzler doğru sırayla birbirinin önüne geçiyor. WebGL yok, kütüphane yok — yirmi beş `div`, yüz başına bir renk. **İki hareket, ikisi de `[data-play]` altında:** basamaklar A1'den C1'e 120ms arayla yukarıdan yerine iniyor, sonra model 19 saniyelik bir yörüngede salınıyor. **Aşağıdan yükselmek denendi ve olmadı:** üç boyutta kırpma yok, alttan gelen basamak zeminin altına taşıp şerhin üstüne biniyordu — `overflow: hidden` çözüm değil, `preserve-3d` zincirini düzleştiriyor. **Sonsuz yörünge bu dosyanın "süs hareket yok" kuralına bilinçli bir istisna** ve gerekçesi kayda geçsin: nesne bir ölçüm göstermiyor, ölçeğin KENDİSİ; dönerken hiçbir sayı değişmiyor. **`opacity` modelde hiç kullanılmıyor** — 1'in altındaki her değer yığın bağlamı açıp `preserve-3d`yi düzleştiriyor, model animasyon ortasında düz çizime dönüp bitince yerine oturuyordu. Bütün hareket `transform`. **Ölçerek bulunan üç kusur:** (1) `rotateX(17deg)` kamerayı ALTA koyuyordu — arka-alt kenar ön-alt kenardan aşağıda çıkıyordu (443'e karşı 427) ve her basamağın altından koyu bir kuyruk sarkıyordu; CSS'te Y ekseni aşağı baktığı için üstten bakmak negatif işaret istiyor. (2) Yükseklik `.model-stage` yerine `.model`de yazılıydı, şerh kutusundan taşıp tezin üstüne biniyordu (şerh 519–535, tez 521–651). (3) Riser'lara basılı bant etiketleri taş rengi yüzde 2,05:1'de kalıyordu; nötr basamak koyu etiket, yanan basamak açık etiket alıyor çünkü ön yüzü koyu yeşil. Ayrıca basamak paleti kâğıttan ayrışmadığı için bir kademe koyulaştırıldı. |

| 2026-08-25 | **Işık merdivende dolaşıyor, bir basamakta durmuyor — ve model çubuk grafiği olmaktan çıktı.** Ürün sahibi A2'de takılı kalan yanan basamağı istemedi. Işık artık A1'den C1'e yürüyor: beş basamak × 1,2s = 6s, döngü tam kapanıyor; ölçek etiketi kendi basamağıyla birlikte yanıyor. **Kaybolan iddia ve nereye gitti:** "aşağıdaki cümle A2 ölçüldü" bağlantısı kalktı. Ölçüm kaybolmadı — aynı cümlenin bulguları "Aynı motor, iki cümle" bölümünde duruyor. Burada kalan şey ÖLÇEĞİN KENDİSİ ve o da veri: `BAND_ORDER` hem kaç basamak kurulacağını hem etiketlerin ne diyeceğini belirliyor. **Modeli maket gibi gösteren dört değişiklik:** (1) yüzler renk jetonunun üstüne gradyan taşıyor, böylece ışık dolaşırken yalnızca renk değişiyor, gölgelendirme duruyor; (2) her basamağın tread ile riser'ı buluştuğu yere aydınlık bir kenar izi kondu — katı bir cismin köşesini satan şey bu; (3) zemin teması eklendi, model havada durmuyor — bulanıklık `filter` ile DEĞİL radyal gradyanla, çünkü `filter` de `opacity` gibi `preserve-3d` zincirini düzleştiriyor; (4) bant etiketleri modelin dışına çıktı: riser'lara basılıyken 10px'e sıkışıp eğik yüzeyde okunmuyor ve modeli kalabalıklaştırıyorlardı, altta düz bir ölçek satırı olarak okunur hâle geldiler. **Yan yüzler de tırmanışa katıldı:** yalnızca ön ve üst yanarken C1'in sağ yüzü taş renginde kalıyordu — arkasında altıncı bir basamak olmadığı için hiçbir şeyin kapatmadığı tek yan yüz o. **Bitmiş kare doğrulandı:** `prefers-reduced-motion` altında sıfır animasyon ve beş basamağın beşi de taş renginde — hiçbiri yanık kalmıyor. |

| 2026-08-25 | **"Sayfa hep yazı" — ölçüldü ve iki bölüme çizim geldi.** Ürün sahibi metni silmek istemedi, metnin YANINDA hiçbir şey olmamasından şikâyetçiydi. Bölüm bölüm ölçüldü: `.mech` 80 kelime ve **sıfır** görsel nesne, `.trial` 1196px'te 214 kelime ve 5 nesne. **(1) `.mech` artık anlattığı şeyi ÇİZİYOR:** beş istasyonlu bir ray, her istasyon kendi sütununun tam üstünde, rayda ilerleyen jeton geçtiği istasyonu yakıyor. İstasyon sayısı `LAYERS`ten, iki mor halka `layer.model`den — katman eklenirse istasyon ekleniyor. Hareket açıklıyor, süslemiyor: bölümün tek cümlesi "metin beş katmandan sırayla geçiyor" ve kıpırdayan tam olarak o. Kahramandaki merdiven hacimli, bu çizgisel — aynı sayfada iki farklı görsel dil bilerek. **(2) `.trial`'ın iki bölmesi aynı taksonomi şeridini taşıyor:** beş aile, yirmi bir yuva; bozuk cümlede beşi dolu, doğru cümlede hiçbiri. Aynı ızgara, aynı motor, iki sonuç. Yuva sayısı `SUBCATEGORIES`ten, dolanlar render anında hesaplanan bulgulardan. Şerit yalnızca `part === "both"` yani anasayfada çiziliyor; kapı ekranı taksonomiyi zaten kendi adımında yirmi bir jetonuyla anlatıyor. **İki eski hareket kaldırıldı, ikisi de artık rayın tekrarıydı:** hattın üstündeki 2px'lik süpürme (820px altında 90° çevrilmek zorundaydı; ray her genişlikte yatay kalıyor, çevrilecek bir şey yok) ve hücre içi arma izi. **İkincisi bakarak değil PİKSELDEN bulundu:** ekran görüntüsünde hücre üst kenarında 82 piksel genişliğinde yeşil bir parça duruyordu, `getComputedStyle` saç teli rengi bildirdiği hâlde — yarım kalmış bir kare, rayın hemen altında, hiçbir şey anlatmadan. **Sessiz bir gerileme de düzeltildi:** `.mech .pipe` içinde `column-gap` yazılıp arkasından `gap: 0` geliyordu ve kısayol sütun boşluğunu siliyordu; üstündeki yorumun anlattığı düzeltme (481–820px arasında iki metin sütununun bitişmesi) aylardır uygulanmıyormuş. **Sonuç:** `.mech` 0 → 6 görsel nesne, `.trial` 5 → 47. |

| 2026-08-26 | **Paylaşım kartı geldi — depoda hiç OG görseli yokmuş.** Link paylaşıldığında (WhatsApp, LinkedIn, iş başvurusu) önizleme görselsiz çıkıyordu. Görsel `app/opengraph-image.jpg`: Next'in dosya kuralı, yani `og:image`, `twitter:image` ve boyut etiketlerini kendisi üretiyor — hiçbir yere el ile yol yazılmıyor, ileride fotoğrafı değiştirmek dosyayı değiştirmeye iniyor. **Üç ayrıntı, üçü de olmadan önizleme boş çıkıyor:** `metadataBase` olmadan Next göreli yol yazıyor ve hiçbir platform çözemiyor; `twitter.card` bildirilmeden X büyük görsel yerine küçük özet gösteriyor; `opengraph-image.alt.txt` sonunda satır sonu bırakılırsa o satır sonu etiketin içine kaçıyor. **`npm run og`** kartı kaynak fotoğraftan türetiyor: kaynak 1635×962 ve 1,7 MB, kart 1200×630 ve 126 KB — fotoğrafta PNG'nin kayıpsızlığının faydası yok. Betik **önce orana kırpıp sonra ölçekliyor**; doğrudan `sips -z` iki ekseni de zorluyor ve 1,700 oranındaki kaynağı 1,905'e sıkıştırıp fotoğrafı eziyor. Betik kendi çıktısını denetliyor: yanlış boyutta ya da 400 KB üstünde düşüyor. **Kayda geçsin, ürün sahibi fotoğrafı ileride değiştirecek:** üretilen görselde blokların çevresinde çizgi ikonlar dolaşıyor — açık kitap, konuşma balonu, kulaklık, dünya. Anasayfanın kendi giriş cümlesi "Kurs değil, sohbet botu değil, yazım denetleyicisi değil" diyor, yani görsel şu an metnin reddettiği üç şeyi çiziyor. Merdivenin kendisi doğru, yeşil blok da tam bizim yanan basamağımızın yerinde (soldan ikinci). Şimdilik böyle kalması ürün sahibinin kararı. |

| 2026-08-26 | **Bulgular çekmeceye girdi, sekme ikonu yeniden çizildi — ve gözden geçirme yedi kusur çıkardı, üçü bir saat önce benim soktuğum gerilemeydi.** Duruşma bölümü sayfanın üçte biriydi: ÖLÇÜLDÜ 3621px'in 1230'u, bulgu bloğu 646px, onun 227'si saf gerekçe metni — ekranda aynı anda on beş satır açıklama duruyordu ve hiçbiri istenmemişti. Her bulgu artık bir `<details>`/`<summary>`: kapalı satırda okuyanın aradığı şey, yani DÜZELTME görünüyor; gerekçe bir tık ötede ve İLKİ AÇIK geliyor (satırların açıldığını görmeden kimse tıklamaz). Yerli HTML seçildi — JavaScript'siz çalışıyor, klavyeyle açılıyor, ekran okuyucu durumu bildiriyor, metin DOM'da kalıyor. **Sonuç: 1230 → 881px, %34 → %26,9; bulgu bloğu 646 → 297px.** **Kapı ekranında beşi de açık:** o adımın gövde cümlesi "beş bulgu aşağıda, motorun kendi açıklamalarıyla duruyor" diyor ve dördü kapalıyken metin ile şekil ayrışıyordu — bu sayfanın kuralı "ekranda maket bir şey yok" ve ayrışma tam onu deliyor. Politika `open` prop'uyla çağırana bırakıldı. **Düşmanca gözden geçirmenin bulduğu kusurlar:** (1) dar ekranda satır yüksekliği 320px'te **787 piksele** çıkıyordu — kategori `nowrap` olduğu için ~200px alıyor, düzeltmeye 40px kalıyor ve metin harf harf sarıyordu; taşma YOKTU, o yüzden taşma kontrolü görmedi, gören şey satır yüksekliğini ölçmek oldu. (2) Düzeltme görünüm sorgusu değil **container query** istiyordu: 1024px'lik ekranda bölme 490px. Container'ı bloğa koymak da yanlıştı — kapı rafı iki sütunlu, blok 839px ölçülürken satıra 410px düşüyordu; container SATIRIN kendisinde olmalı. (3) `@container` içindeki `white-space: normal` temel kurala **kaybediyordu**: container sorgusu özgüllük eklemiyor, kaynak sırası karar veriyor — katlama uygulanıyor ama kategori sarmıyordu, yani katlamanın tek sebebi boşa gidiyordu. (4) Açılma işareti gradyanla çizilmişti ve **zorlanmış renklerde gradyanlar düşüyor**: `backgroundImage` "none, none" oluyor, satırın açılabildiğini söyleyen tek ipucu kayboluyordu; `+`/`−` karakterine düşüyor. (5) Dolgu karttan satıra taşınınca kapı rafındaki **ezme ilişkisi koptu** ve iki dolgu üst üste bindi: iç boşluk 18 → 40px, her hücrede 44px okuma alanı gitti. (6) `:first-child { padding-left: 0 }` iki sütunlu rafta tırtık üretiyordu (aynı sütunda rozetler 223, 241, 241). (7) `.sample-line:hover` gereksizdi (`.sample-finding:hover` zaten vardı) ve onu iptal eden kural hiçbir şeyi iptal etmiyordu. Ayrıca `.sample-no { flex: none }` ölüydü ve yolda ölçülen ilgisiz bir kusur: `.stamp-row` iki tarafta da `nowrap` + noktalı öncülün 12px alt sınırı yüzünden hiç kısalamıyor, kapı ekranı 320px'te **49px yatay taşıyordu**. **Sekme ikonu çizgiden bloğa geçti:** 3,4 birimlik kontur 16px'te 1,7 CSS piksel ve bulanıklaşıyor; katı dikdörtgen keskin kalıyor. Bloklar BİTİŞİK — aralıklı bir sürüm çizilip yan yana karşılaştırıldı, ayrık bloklar çubuk grafiği gibi okunuyordu, oysa ismin kendisi merdiven. Basamak üstlerinde ince aydınlık iz: anasayfadaki 3B modelin tread ışığının aynısı. `npm run icon` aynı SVG'den `app/apple-icon.png` türetiyor, karo yuvarlaması sıfırlanarak — iOS kendi maskesini uyguluyor, kaynakta da yuvarlak olursa köşede çift kavis çıkıyor. |

| 2026-08-26 | **Çekmece değişikliği düşmanca gözden geçirildi: 16 iddia, 11'i ayakta kaldı — ve en ağırı klavye odağıydı.** Sekizi bir önceki commit'te düzeltilmişti; kalan üçün ikisi yüksek. **(1) ODAK, HİÇ BOYANMAMIŞ BİR SATIRA DÜŞÜYORDU.** `finding-wipe` bulguyu `clip-path` ile sıfır genişliğe kırpıyor ve `both` dolgusu bunu gecikme boyunca geriye doğru uyguluyor. Satır `<details>` olduğundan beri kutunun içinde odaklanabilir bir öğe var ve sıra şöyle işliyordu: Tab odağı `<summary>`ye indiriyor → tarayıcı satırı görünüme kaydırıyor → IntersectionObserver o kaydırmayla tetikleniyor → `data-play` basılıyor → kırpma odaklı satırın üstüne kapanıyor. GERÇEK TAB TUŞUYLA ÖLÇÜLDÜ: soğuk açılıştan sonra altıncı Tab tam oraya iniyor, `:focus-visible` true kalıyor ama halka kırpılan kutunun içinde olduğu için çizilmiyor, `elementFromPoint` satırı değil kabı döndürüyor — fare de erişemiyor. Pencere 1,76–2,40 saniye ve beş ardışık klavye durağının beşi de bu durumda. WCAG 2.4.7. Kırpma kuralı kutuda odaklanabilir hiçbir şey yokken yazılmıştı; kusur çekmeceyle birlikte doğdu. Düzeltme `[data-play="1"] .sample-finding:focus-within { animation: none }`. **(2) Kapı rafı container sorgusunu hiç kullanmıyormuş:** `.step-figure` katlama kuralı (0,2,0) koşulsuz yazılmıştı ve container kuralını (0,1,0) her genişlikte eziyordu. Gerekçesi yalnızca iki sütunlu rejimde geçerli (dört satır 543px, beşincisi `grid-column: 1 / -1` ile 1087px); 940px altında raf tek sütuna iniyor ve korunacak tutarsızlık kalmıyor. ÖLÇÜLDÜ: 820–940px arasında satır kutusu 676–782px, yani 620 eşiğinin çok üstünde, ama beşi de katlanıyor ve raf olabileceğinden **108 piksel** yüksek duruyordu. `@media (min-width: 941px)` ile kapsandı: raf 647 → 539px. **(3) Odak halkası kendi kuralına uymuyormuş:** `--ring` vurgu renginin %45 alfası ve kâğıt zeminde **1,94:1** — odak göstergesi için taban 3:1. Tam opak vurgu rengine çevrildi, 5,08:1. Jeton `.btn`, `.input` ve bulgu satırını birlikte besliyor, yani tek satır bütün ürünün odak göstergesini kaldırdı. **Doğrulama sonrası ELENENLER, yeniden tartışılmasın diye kayda geçiyor:** dört çekmecenin kapalı olmasının Türkçe sinyalini zayıflattığı (açık satır zaten onu taşıyor), 620px eşiğinin kapı için yanlış olduğu, okun sesli bir ayırıcıya ihtiyacı olduğu, `.sample-why`nin `ch` ölçüsünü dolgunun yediği, ve açık satırın ızgara satırını gerdiği (kapı beşini de açık render edince konusuz kaldı). |

| 2026-08-26 | **Fotoğraf sayfaya girdi; duruşma şeridi kendi kâğıdını aldı; koyu bant imleçte beyaz parlıyormuş.** **(1) FOTOĞRAF:** ürün sahibi ürettiği fotoğrafın sitede görünmediğini söyledi ve haklıydı — yalnızca paylaşım kartına bağlanmıştı, o da linki bir yere yapıştırınca çıkıyor. Artık kapanış bandı, kenardan kenara. Sayfadaki diğer bütün görseller ölçülmüş veriden çiziliyor; bu bilerek öyle değil, çünkü kapanış bir ölçüm değil davet — ve gösterdiği şey kahramandaki üç boyutlu merdivenin taştan hâli. Fotoğrafın sağ üçte ikisi boş kâğıt, cümle oraya oturuyor. `next/image` statik içe aktarma, tembel yükleme, yeni bağımlılık yok. Kadraj `%82`: ortadan kırpınca blokların tabanı ve gölgesi taşıyor, merdiven havada kesilmiş duruyordu; üstten atınca palmiye gölgesi ile konuşma balonu kadrajdan çıkıyor. 860px altında fotoğraf metnin arkasından çıkıp kendi bandını alıyor — tek sütunda cümle blokların üstüne düşüyor ve boş kâğıt 390px kadrajında hiç yok. **(2) KONTRAST ARACI YANLIŞ ÖLÇTÜ, ürün değil.** Kapanış başlığını `1:1` bildirdi. Sebebi: zemini "kutudaki en sık renk" diye buluyordu ve 48px serif başlıkta harf pikselleri 2493, zemin pikselleri 1387 — en sık renk metnin kendisi çıkıyordu. Gerçek oran 10,45:1. Araç artık CSS'ten bildiği metin rengine yakın pikselleri eleyip mod alıyor, ve ölçümden önce sayfayı kaydırıp görselleri bekliyor: `networkidle0` tembel görseli yüklemiyor, eski koşum bulanık yer tutucuyu ölçüyormuş. **(3) DURUŞMA ŞERİDİNİN KENDİ KÂĞIDI:** zemini `--surface`tı ve ÖLÇÜLDÜ, `--plane`e karşı **1,07:1** — bölüm ekranda hiç ayrışmıyordu. Yeni ton bölümün kendi argümanını taşıyor: gürültülü cümle donuk, kullanılmış kâğıtta; doğru cümle temiz kâğıtta. Ölçülen adımlar: iddia→duruşma 1,20 · bölmeler arası 1,29 · duruşma→mekanizma 1,20 · bant hâlâ 16,23 üstte. Koyu temada aşağı yer olmadığı için şerit yukarı çıkıyor, banttan az: plane → duruşma → bant. **Donuk kâğıt mürekkebi yutuyor** ve araç zemin değişir değişmez dört kusur yakaladı: `--ink-3` 4,19'a, vurgu 3,94'e düşmüştü. Bölüm kendi kâğıdını aldıysa kendi mürekkebini de alıyor — bandın çözümünün aynısı. **(4) BANT İMLEÇTE BEYAZ PARLIYORMUŞ:** `.measure` alt ağacı için paleti yeniden tanımlıyor ama `--surface-2`yi tanımlamamıştı, o yüzden `.proof-cell:hover` temel jetonu okuyordu. ÖLÇÜLDÜ: neredeyse siyah bandın (#101613) üstüne imleçle **rgb(240,238,232)** basılıyordu. Koyu temada aynı kusurun sessiz hâli vardı — imleç renginin bandan KOYU olması, yani hücrenin kalkmak yerine çökmesi. Bant artık kendi imleç yüzeyini taşıyor: zeminine karşı 1,24:1 (açık) ve 1,22 (koyu), sayı o zeminde 13,48:1 ve 10,05:1. |

| 2026-08-26 | **Duruşma şeridinin başlığı yeşil levhaya alındı.** Ürün sahibi yalnızca başlık ve altındaki cümleyi kastediyordu, aşağısını değil: "her şey birbirinin üstüne yazılmış gibi duruyor." Doğruydu — başlık, cümle ve hemen altında aynı zeminde başlayan iki bölme art arda gelince üçü tek yığın gibi okunuyordu. Başlık ile cümle artık tek nesne: markanın kendi yeşilinde, kenardan kenara bir levhada, üstünde 38–68px, altında 40–72px, ikisinin arasında 12–18px nefesle. Levhanın alt kenarı aşağıdaki kâğıtlara karşı sert bir kenar, yani bölüm "başlık, sonra iki örnek" diye okunuyor. **Renk seçimi:** sayfadaki koyu bant yeşile çalan bir siyah, bu ise doğrudan yeşil — akraba ama aynı değil, ve aralarına `.mech`in açık şeridi giriyor. ÖLÇÜLDÜ: levhada başlık 8,92:1, cümle 5,54:1 (açık tema), 11,66 ve 6,68 (koyu); levha altındaki kâğıttan 7,24:1 ayrı. Şeridin üst dolgusu levhanın içine taşındı — levha bölümün kendi kenarına dayanmak zorunda — ve bölmeler 3. satırdan 2'ye geçti. Mobil blok da düzeltildi: orada hâlâ 3 ve 4'e çivileniyorlardı ve yorumu eski sayıyı aktarıyordu. |

| 2026-08-26 | **Mekanizma şeridi kendi kâğıdını aldı — ve ayrım DEĞERDEN değil SICAKLIKTAN geliyor.** Sayfadaki tek kimliksiz bölümdü: zemini `--plane`, yani kahramanla aynı, o yüzden bir yer değil devam gibi okunuyordu. Ton bölümün kendi anlamından: `--model` moru bu şeritte ağırlığı olan tek jeton, ama çok seyreltilmiş — beş katmanın ÜÇÜ model kullanmıyor, şerit mor bir blok olamaz. **Neden sıcaklık:** açık paletin değer aralığı kalabalık (donuk kâğıt 0,724 · temiz kâğıt 0,939 · plane 0,880) ve aralarına görünür bir kademe sığmıyor; sıcak bejden soğuk lavantaya geçiş ise tam genişlikte bir bantta aynı parlaklıkta bile okunuyor. Sayfa artık kâğıt → makine → alet diye ilerliyor: yazının sıcak sayfaları, mekanizmanın soğuk kâğıdı, ölçümün siyaha yakın bandı. **Mor yıkamayı %6'dan %9'a çıkarmak** (soğuk zeminde tutunsun diye) üç metnin kontrastını tabanın altına indirdi: `--ink-3` yıkanmış hücrede 4,00:1'e, `--model` jetonu 4,32'ye. Şerit kendi kâğıdını aldıysa kendi mürekkebini de alıyor — duruşma kâğıdı ve koyu bantta yapılanın aynısı. **Kalıp yerleşti:** bir bölüm kendi zeminini alıyorsa `--ink-3`, `--accent` ya da `--model` gibi jetonlarını kendi alt ağacında yeniden tanımlamak zorunda; üç bölümde de aynı kusur aynı sırayla çıktı ve aynı çözümle kapandı. |

| 2026-08-26 | **Lavanta geri alındı, sekme ikonu gerçekten göründü, model derinleşti, kapı ekranı anasayfanın diline geçti.** **(1) LAVANTA REDDEDİLDİ.** Mekanizma şeridinin tonunu `--model` morundan türetmek fikirdi ama sayfaya yabancı düştü: bu sitenin bütün yüzeyleri sıcak kâğıt, tek soğuk bant hepsinden koptu. **Ders:** mesele adım değil AİLE; ayrımı yalnız sıcaklık farkına yıkmak yetmiyor. Şerit artık kâğıdın kendisi, koyulaşmış hâli — sayfa tek rampa: kâğıt → kil → siyaha yakın bant. Ölçülen: üstündeki kâğıttan 1,21:1, alttaki banttan 11,14:1. Kil de mürekkebi yuttu, jetonlar alt ağaçta yeniden tanımlandı, mor yıkama %9'dan %6'ya döndü (o değerde işaretlemesi gereken metni boğuyordu). **(2) SEKME İKONU.** `app/icon.svg` doğru etiketi üretiyor ve çoğu tarayıcı çiziyor — ama favicon tarayıcının en agresif önbelleklediği kaynak ve bazı sürümler SVG'yi hiç denemeden köke `/favicon.ico` istiyor; o dosya yoksa sekmede boş sayfa simgesi kalıyor. `npm run icon` artık aynı SVG'den 16/32/48'i `app/favicon.ico`ya paketliyor. **(3) MODEL DERİNLEŞTİ.** Paleti kâğıda çok yakındı, karton gibi okunuyordu; yüzler koyulaştı ve aralarındaki adım genişledi — gerçek bir cisimde aydınlık üst yüz ile gölgedeki yan yüz arasındaki fark büyüktür. Işık düşüşü yüz başına: üst yüzde derinlik boyunca, ön yüzde yumuşak, yan yüzlerde en sert. **Gölge baştan beri vardı ve görünmüyordu:** koyu merkezi tam blokların altındaydı, bloklar da onu çiziyordu. Düzlem blok derinliğinin 2,6 katı ve bloklar ortadaki %38'ini kaplıyor; gölge sol üstten gelen ışığın onu gerçekten atacağı ön banda (%71–84) taşındı. İki katman: dar temas + geniş yayılım. **(4) KAPI EKRANI.** Anasayfa katı 3B nesneye ve zemin rampasına geçmişken kapı hâlâ tek kâğıt üstünde ince çizgili vektör çiziyordu. Düz kadran kaldırıldı, yerine merdiven: TEK NESNE, İKİ DAVRANIŞ — anasayfada ışık tırmanıyor (vaat), kapıda ölçülen bantta duruyor (okuma). Kadranın ikinci işi (taksonomiyi çevrede göstermek) zaten 02. adımda yirmi bir jetonla yapılıyordu. Doğruluk levhası anasayfadaki bandın dilini aldı. **İki jeton kusuru, ikisi de tanıdık:** `color` açıkça yazılmak zorunda (devralma jetonu değil çözülmüş rengi taşıyor — aynı kusur anasayfa bandında 1,02:1 ölçülmüştü), ve `--surface` de devredilmek zorunda çünkü `.proof-cell` kendi zeminini ondan alıyor; devredilmeyince hücreler koyu levhanın üstünde açık kaldı ve sayı 1,04:1 çıktı, beyaz üstünde beyaz. |

| 2026-08-26 | **RADİKAL KARAR: yeşil artık vurgu değil YÜZEY rengi, ve model alçıya döndü.** Ürün sahibi tonun hâlâ kötü olduğunu, sayfanın iç açıcı olmadığını ve "hep aynı şeyleri yapıyorsun, radikal karar alabilirsin" dedi. Haklıydı — üç turdur ton ayarlıyordum. **Mekanizma şeridinde iki ton denendi ve ikisi de yanlıştı:** soğuk lavanta bütün yüzeyleri sıcak kâğıt olan bir sayfaya yabancıydı; koyu kil aileyi tutturdu ama ÇAMURLUYDU — ölçüm aleti olmak kasvetli olmayı gerektirmiyor. Şerit artık markanın yeşilinin AÇIK ucu; duruşmanın başlık levhası derin yeşil. İki uç bir sistem kuruyor, aralarındaki mesafe tekrar değil ritim. **Model mimarlık maketi alçısı oldu:** kum taşı kâğıda çok yakındı ve karton gibi okunuyordu, grafit koyu ve çamurluydu; alçı üçüncüsü — parlak, temiz, kendi gölgesiyle ayakta. Formu artık renk değil IŞIK taşıyor. **Tırmanan ışık çoğu zaman yokmuş:** penceresi 6 saniyelik döngünün %9–15'iydi, yani basamak başına 360ms, oysa basamaklar arası 1200ms. ÖLÇÜLDÜ: sekiz rastgele örnekten beş-altısında merdivende hiç yeşil yoktu. Pencere %3–22'ye çıktı, bir sonraki basamak öncekini söndürmeden yanıyor — ışık yanıp sönmüyor, YÜRÜYOR. Sekiz örnekte tek boşluk. **Yolda iki yapısal kusur, ikisi de benim:** (1) önceki bir dilim düzenlemem bir kapanış parantezini yemiş ve `prefers-color-scheme` bloğunu ikiye bölmüştü; stil sayfası TAMAMEN düşüyor, sayfa çıplak render ediliyordu — **ve kontrast aracı o sayfada TEMİZ rapor veriyordu**, çünkü beyaz üstünde siyah her eşiği geçer. Yakalatan şey karar değil SAYIydı: ölçülen kutu 1422'den 1304'e düşmüştü. **Ders: aracın verdiği hükme değil, ölçtüğü miktara da bak.** (2) İki koyu tema bloğu ayrışmıştı (`--step-tread` birinde #39444d, diğerinde #2e3941), çünkü `count=1` ile yapılan bir değiştirme hep ilkine çarpıyor. Artık jeton jeton aynılar ve bu eşitlik doğrulamanın parçası. |

| 2026-08-26 | **"Her şey iç içe" ölçüldü, ve sebep renk değildi — üç turdur yanlış yeri onarıyormuşum.** Ürün sahibi neyin kötü olduğunu adlandıramadı; iki bağımsız teşhis ölçtü ve aynı yere vardı. **Sayfanın %92,8'i mürekkep doluydu:** 3435 pikselde dört dinlenme şeridi, toplam 248px. **Yedi bölümün yedisi de aynı kompozisyondu** — kenardan kenara bant, x=72'de 40px başlık, yanında alt cümle, mikro etiketlerle kaplı bir nesne; kapsanmış bölüm sayısı sıfır, sol kenar 3435px boyunca bir kez kıpırdamıyordu. **Ve hiyerarşi TERSTİ:** duruşma bandının içindeki 114px'lik boşluk, altı bölüm sınırından üçünden (103 · 47 · 24) genişti. İki paragrafı ayıran boşluk iki bölümü ayıran boşluktan büyükse göz paragrafı bölüm sanar — "iç içe"nin birebir tarifi bu. **KARAR: tek kâğıt ve bir ÖLÇÜM PAYI.** Sayfanın sol kenarında yalnızca ölçülen sayılar duruyor — 5 bulgu · 3 model kullanmayan katman · %4,9 yanlış alarm — ve gövde metni oraya asla girmiyor. Bir ölçüm aletinin sol çizgisi ölçümlerinden oluşuyor; payda ölçülmemiş bir şey belirirse omurga yalan söylüyor. **Üç dikey çizgi, üçünün tek işi var:** 72 çerçeve ve ölçülen sayılar · 216 bütün gövde metni ve bütün çizimler · 864 sağ sütun. Pay 1240'ta BASAMAK gibi açılıyor, kesir almıyor — yarım bir pay 54px'lik rakamı kesen bir sütun demek. **Zemin altı düzlemden üçe indi** ve ilk 1400 pikselde tek bir zemin değişimi yok. Duruşmanın yeşil levhası silindi (dolu bir bandın içine aynı genişlikte başka renkte ikinci bir dolu bant), mekanizmanın nane zemini silindi — üç turda kendi yüzeyini bulamayan bölümün ihtiyacı yüzey değil YER'di. **Dikiş bir değer oldu:** 144 · 96 · 96 · 96 · 96 · 0. Bölüm içi hiçbir boşluk 32'yi geçemiyor; 32 ile 96 arasında hiçbir kademe yok ve bu bilerek — ara kademe tersliğin kaynağıydı. Oran her genişlikte ≥2,39. **Punto 21'den 17'ye, 9–17px bandındaki 13 punto 6'ya** indi. **Yolda iki gerçek kusur:** (1) doğruluk bandının dördüncü sayısı — `41` — hem anasayfada hem kapıda GÖRÜNMÜYORDU; `value-latch` 1ms `steps(1, end)` ve örtük `to` ile koşuyor ve bitiş değeri `opacity: 0`a geri çözülüyordu, animasyon kendini "finished" bildirdiği hâlde. Ölçülmüş bir sayının yeri boş duruyordu. 1ms doğrusal geçiş aynı sertlikte mandallıyor ve bitişi kesin. (2) `.mech .pipe` kabuk silme kuralını kaybetmiş, hücreler ızgaranın saç teli zeminini gösteriyor ve altı metin 3,61–4,04:1'e düşüyordu. |

### Hâlâ açık

- **Yurtdışı hedefi** — Türkiye'den uzaktan yabancı şirkete mi, taşınmak mı, önce eğitim mi?
  Hedef seviyeyi ve sertifika (IELTS/TOEFL) gerekip gerekmediğini doğrudan belirliyor.
- **Haftalık gerçek saat.** Takvim buna göre kurulacak; plan aynı kalır, süre değişir.
- **Başlangıç seviyesi.** İlk hafta birkaç kayıtla ölçülecek — tahminle değil.
