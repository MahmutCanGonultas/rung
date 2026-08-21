/*
 * Tohum veri (seed data).
 *
 * Bağlamlar ve görevler koda gömülü değil, veritabanına yazılan **veri**.
 * Plan §09: "yeni bağlam eklemek satır eklemektir."
 *
 * Görevler İngilizce çünkü kullanıcı İngilizce yazacak; ipuçları Türkçe çünkü
 * görevi anlamak için İngilizce sınav olmaması gerekiyor.
 *
 * Kelime aralıkları seviyeye göre: A1 kısa ve şimdiki zaman, C1 uzun ve
 * kayıt (register) kontrolü isteyen metinler.
 */

export const CONTEXTS = [
  {
    slug: "daily",
    name: "Günlük hayat",
    description: "Arkadaş, komşu, alışveriş, randevu — günlük iletişim.",
    sortOrder: 1,
  },
  {
    slug: "work",
    name: "İş",
    description: "Ekip içi yazışma, toplantı, durum bildirimi, rica.",
    sortOrder: 2,
  },
  {
    slug: "technical",
    name: "Teknik",
    description: "Hata anlatmak, karar gerekçelendirmek, belge yazmak.",
    sortOrder: 3,
  },
  {
    slug: "formal",
    name: "Resmî",
    description: "Kurum yazışması, başvuru, şikâyet, resmî ricalar.",
    sortOrder: 4,
  },
  {
    slug: "free",
    name: "Serbest",
    description: "Konu senin. Aklından geçeni yaz.",
    sortOrder: 5,
  },
];

const RANGE = {
  A1: [30, 50],
  A2: [40, 70],
  B1: [60, 90],
  B2: [100, 140],
  C1: [140, 200],
};

function t(context, level, prompt, hint) {
  const [min, max] = RANGE[level];
  return { context, level, prompt, hint, minWords: min, maxWords: max };
}

export const TASKS = [
  // ── günlük hayat ──────────────────────────────────────────────────────
  t("daily", "A1", "Describe your morning routine.", "Şimdiki zaman, kısa cümleler."),
  t("daily", "A1", "Write a short message to a friend about your weekend plan.", "Basit bir mesaj, tek paragraf."),
  t("daily", "A2", "Tell a friend about a film you watched last week.", "Geçmiş zaman ağırlıklı."),
  t("daily", "A2", "Ask a neighbour to look after your plants while you are away.", "Rica kalıpları."),
  t("daily", "B1", "Ask your landlord about the deposit you have not received.", "Resmî olmayan e-posta, kibar ama net."),
  t("daily", "B1", "Explain to a friend why you decided to change your daily habits.", "Sebep-sonuç bağlaçları."),
  t("daily", "B2", "Complain to a shop about a late delivery and say what you expect.", "Şikâyet ederken tonu koru."),
  t("daily", "B2", "Persuade a friend to join you on a trip they are unsure about.", "İkna, karşı görüşü de tanı."),
  t("daily", "C1", "Describe a small everyday habit that says something larger about you.", "Somut ayrıntıdan genellemeye geç."),
  t("daily", "C1", "Write about a disagreement with someone close and how it resolved.", "Nüans: suçlamadan anlat."),

  // ── iş ────────────────────────────────────────────────────────────────
  t("work", "A1", "Introduce yourself to a new team in a few sentences.", "Ad, rol, ne yaptığın."),
  t("work", "A1", "Write a short message saying you will be late to a meeting.", "Kısa ve net."),
  t("work", "A2", "Give a short status update on something you are working on.", "Ne bitti, ne kaldı."),
  t("work", "A2", "Ask a colleague for help with a task you are stuck on.", "Neye takıldığını söyle."),
  t("work", "B1", "Give a 60-second status update in a meeting.", "Üç madde: yapıldı, sürüyor, engel."),
  t("work", "B1", "Ask for a deadline extension and explain why you need it.", "Gerekçe + yeni tarih öner."),
  t("work", "B2", "Disagree with a decision your team made, and propose an alternative.", "Karşı çıkarken kapıyı kapatma."),
  t("work", "B2", "Write handover notes for someone covering your work next week.", "Okuyan hiçbir şey bilmiyor varsay."),
  t("work", "C1", "Argue for a change in how your team works, to a sceptical audience.", "İtirazları önden karşıla."),
  t("work", "C1", "Give difficult feedback to a colleague in writing.", "Kayıt (register) kontrolü: net ama incitmeden."),

  // ── teknik ────────────────────────────────────────────────────────────
  t("technical", "A1", "Describe the tools you use every day.", "Basit liste cümleleri."),
  t("technical", "A1", "Explain what your project does in a few sentences.", "Teknik terim az, cümle kısa."),
  t("technical", "A2", "Explain a bug to a teammate: what you saw and what you expected.", "Beklenen / gerçekleşen ayrımı."),
  t("technical", "A2", "Write short instructions for setting up a project.", "Adım adım, emir kipi."),
  t("technical", "B1", "Describe your last project and one thing you would do differently.", "Ne yaptın, ne öğrendin."),
  t("technical", "B1", "Explain a technical decision to a non-technical colleague.", "Jargonsuz, benzetme kullan."),
  t("technical", "B2", "Write a bug report a stranger could reproduce from.", "Adımlar, ortam, kanıt."),
  t("technical", "B2", "Compare two approaches and recommend one, with the trade-off stated.", "Takası açıkça yaz."),
  t("technical", "C1", "Write a short design document for a change you want to make.", "Problem, seçenekler, karar, riskler."),
  t("technical", "C1", "Review someone else's approach and raise concerns without dismissing it.", "Nüans: eleştiri ile reddetmek farklı."),

  // ── resmî ─────────────────────────────────────────────────────────────
  t("formal", "A1", "Write a short email asking for opening hours.", "Selamlama ve kapanış kalıpları."),
  t("formal", "A1", "Fill in a request: say who you are and what you need.", "Doğrudan ve kısa."),
  t("formal", "A2", "Decline an invitation politely and give a reason.", "Nazik ret kalıpları."),
  t("formal", "A2", "Ask an office to correct a mistake in a document.", "Hatanın ne olduğunu net söyle."),
  t("formal", "B1", "Write a cover message for a job application.", "Neden sen, neden onlar."),
  t("formal", "B1", "Request a document from an institution, explaining why you need it.", "Resmî ama insanca."),
  t("formal", "B2", "Write a formal complaint about a service, and state what you want done.", "Duygu değil, olgu ve talep."),
  t("formal", "B2", "Appeal a decision that went against you.", "Yeni bilgi sun, tekrar etme."),
  t("formal", "C1", "Write a letter of recommendation for someone you worked with.", "Somut örnekle destekle, abartma."),
  t("formal", "C1", "Respond to a rejection and keep the relationship open.", "Kayıt kontrolü: kırgınlık sızdırma."),

  // ── serbest ───────────────────────────────────────────────────────────
  t("free", "A1", "Write about something you did yesterday.", "Konu serbest, cümleler kısa."),
  t("free", "A1", "Describe a place you like.", "Beş cümle yeter."),
  t("free", "A2", "Write about a person who taught you something.", "Geçmiş zaman."),
  t("free", "A2", "Describe a decision you made recently.", "Neden öyle karar verdin."),
  t("free", "B1", "Write about a habit you are trying to change.", "Neden zor olduğunu anlat."),
  t("free", "B1", "Describe something you changed your mind about.", "Önce ne düşünüyordun, şimdi ne."),
  t("free", "B2", "Argue for an unpopular opinion you actually hold.", "Karşı tarafı da adil anlat."),
  t("free", "B2", "Write about a mistake that turned out to be useful.", "Anlatı yapısı: kurulum, dönüm, sonuç."),
  t("free", "C1", "Write about something you find difficult to explain in English.", "Zorluğun kendisini analiz et."),
  t("free", "C1", "Describe a belief you hold that you cannot fully justify.", "Belirsizliği dille taşı (hedging)."),
];
