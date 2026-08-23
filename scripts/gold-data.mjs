/*
 * Altın küme — hataları önceden bilinen paragraflar.
 *
 * Plan §07 birinci savunma. Bu dosya olmadan "prompt'u iyileştirdim" cümlesi
 * ölçülemez bir iddia olarak kalır.
 *
 * TASARIM KARARLARI
 *
 * 1. **Temiz paragraflar kümenin parçası.** Sadece hatalı metinlerden oluşan
 *    bir küme yanlış alarmı ÖLÇEMEZ — model her yere hata dese bile yakalama
 *    yüksek çıkar. Kümenin yaklaşık üçte biri hatasız.
 *
 * 2. **Her seviyeden örnek var.** Plan §06: doğruluk seviyeye göre değişiyor
 *    ve tek ortalama sayı bunu gizler. A1'in cümlesindeki zaman hatası ders,
 *    C1'inkinde dalgınlık.
 *
 * 3. **Hatalar Türkçe konuşanın gerçekten yaptığı hatalar.** Artikel
 *    düşürme, birebir çeviri, "I am agree", sayılamayan isim çoğulları,
 *    "discuss about". Genel bir İngilizce hata listesi değil.
 *
 * 4. **`optional: true` tartışmalı olanlar için.** Bulunması iyi,
 *    bulunmaması yakalamayı düşürmesin — stil sınırındaki şeyler.
 *
 * Küme kullanıcı itirazlarıyla büyüyecek (plan §07 beşinci savunma);
 * buradakiler başlangıç.
 */

const t = (level, body, expect = [], notes = null) => ({ level, body, expect, notes });

export const GOLD = [
  // ══════════════════════ A1 ══════════════════════
  t("A1",
    "My name is Ali and i live in Ankara. I am a teacher at a school near my house. Every morning i take the bus to work. I like my job because the children are funny.",
    [["capitalization", "i live"], ["capitalization", "i take"]],
    "Cümle ortasında küçük i — Türkçede 'ben' küçük kaldığı için çok sık."),

  t("A1",
    "I have a apple and a orange in my bag. My mother gives me fruit every day. She says it is good for me. I eat them after the lunch.",
    [["article", "a apple"], ["article", "a orange"], ["article", "the lunch"]],
    "Ünlü sesten önce an; öğün adlarında artikel yok."),

  t("A1",
    "Yesterday I go to the market with my sister. We buy bread and milk for the week. The weather was very cold so we come home quickly and drank hot tea together.",
    [["tense", "I go"], ["tense", "We buy"], ["tense", "we come"]],
    "Geçmiş zaman bağlamında şimdiki zaman — Türkçede zaman eki tek yerde."),

  t("A1",
    "I live in a small flat with my brother. We have two rooms and a small kitchen. The building is old but the neighbours are kind. I am happy here.",
    [],
    "TEMİZ — yanlış alarm ölçümü için."),

  t("A1",
    "My father work in a factory near our house. He start early in the morning and come back at six in the evening. On Sunday he stays at home with us and we watch football.",
    [["agreement", "father work"], ["agreement", "He start"], ["agreement", "come back"]],
    "Üçüncü tekil -s; Türkçede fiil özneye göre bu şekilde değişmiyor."),

  t("A1",
    "I go to school every day except Sunday. My favourite subject is mathematics because it is clear and the answers are never a matter of opinion. My teacher is patient and explains everything twice.",
    [],
    "TEMİZ."),

  t("A1",
    "She is a very good student. She study every evening and she never miss a lesson. Her marks are the best in the class.",
    [["agreement", "She study"], ["agreement", "she never miss"]],
    null),

  t("A1",
    "We have a dog and a cat at home. The dog is big and loud, the cat is quiet and sleeps all day. My little sister plays with them after school every afternoon.",
    [],
    "TEMİZ."),

  // ══════════════════════ A2 ══════════════════════
  t("A2",
    "Last summer I visited my grandmother in the village. She lives in a old house with a big garden. We picked tomatoes and she cooked them for the dinner. I stayed there for two weeks and I was very happy.",
    [["article", "a old house"], ["article", "the dinner"]],
    null),

  t("A2",
    "I am living in Istanbul since 2019. Before that I lived in Bursa with my parents. The city is crowded but I like the energy of it.",
    [["tense", "I am living in Istanbul since"]],
    "since ile present perfect continuous gerekiyor."),

  t("A2",
    "Thanks for the informations you sent me last week. They were very useful for my report and I finished it earlier than I expected. I will send you my answer before Friday.",
    [["countability", "informations"]],
    "Sayılamayan isim çoğulu — Türkçede 'bilgiler' sayılabildiği için çok sık."),

  t("A2",
    "I usually wake up at seven and make breakfast for my family. After that I check my email and start working. On Saturdays I go for a long walk by the sea.",
    [],
    "TEMİZ."),

  t("A2",
    "We should discuss about the new plan tomorrow. I have some questions and I want to explain me my part clearly before the meeting starts.",
    [["preposition", "discuss about"], ["preposition", "explain me"]],
    "Türkçedeki 'hakkında' ve dolaylı nesne alışkanlığı."),

  t("A2",
    "My friend gave me a very good advices about the job interview. I was nervous but his words helped me a lot. In the end they offered me the position.",
    [["countability", "advices"], ["article", "a very good advices", true]],
    "İkinci beklenti TARTIŞMALI (optional): 'a' zaten 'advices' yüzünden yanlış, " +
    "ve iki beklenti aynı yeri gösteriyor. Bir bulgu iki beklentiyle eşleşemediği " +
    "için zorunlu bırakılırsa haksız 'kaçırıldı' üretiyordu."),

  t("A2",
    "The train was late again this morning. I waited on the platform for almost an hour before it finally arrived. Everybody was tired and nobody said anything.",
    [],
    "TEMİZ."),

  t("A2",
    "According to me, the new rules are not fair for the students. Many of them work in the evenings and cannot come to the early classes.",
    [["literal_translation", "According to me"]],
    "'bana göre' birebir çeviri."),

  // ══════════════════════ B1 ══════════════════════
  t("B1",
    "Dear Sarah, I am writing to inform you that I have made a research about the pricing issue. I am agree with your suggestion, but I think we should discuss the details in the meeting of tomorrow.",
    [["collocation", "made a research"], ["tr_pattern", "I am agree"], ["tr_word_order", "the meeting of tomorrow"]],
    "Üç klasik Türkçe kaynaklı hata bir arada."),

  t("B1",
    "I have been working at this company for three years now. The team is small, which means everyone knows what the others are doing. That makes decisions faster, but it also means mistakes are visible to everybody.",
    [],
    "TEMİZ — B1 seviyesinde doğal metin."),

  t("B1",
    "The deposit was not returned although the contract said thirty days. I called the office many times but nobody answered. I am writing to ask when the transfer will be made.",
    [],
    "TEMİZ."),

  t("B1",
    "In the last years the market has changed a lot. Many companies started to work remotely and the offices became empty. I think this is a good development for the families.",
    [["preposition", "In the last years"], ["article", "the families"]],
    "'son yıllarda' birebir çeviri; genel anlamda artikel fazla."),

  t("B1",
    "I am boring in my current job because every day is the same. I want to find a position where I can learn new things and meet different people.",
    [["wrong_word", "I am boring"]],
    "boring/bored karışması — sıfat yönü."),

  t("B1",
    "We need to prepare the presentation before Thursday. I will write the first part and you can review it, then we can decide together which examples to keep.",
    [],
    "TEMİZ."),

  t("B1",
    "The manager said that the project will be finish next month. Everybody in the team is working hard, but I am not sure that we can arrive to the deadline.",
    [["tense", "will be finish"], ["preposition", "arrive to"]],
    null),

  t("B1",
    "I would like to ask for a few days off in September. My sister is getting married and I need to travel to another city for the ceremony.",
    [],
    "TEMİZ."),

  t("B1",
    "Please write me back soon because the client is waiting for an answer. If we do not reply until Friday, they will probably choose another company.",
    [["preposition", "until Friday"]],
    "'e kadar' — burada by gerekiyor. Ton meselesi (write me back) tartışmalı, beklentiye konmadı."),

  t("B1",
    "Our office moved to a new building last month. It is closer to the metro, which makes the commute easier for almost everyone on the team.",
    [],
    "TEMİZ."),

  // ══════════════════════ B2 ══════════════════════
  t("B2",
    "I am writing to complain about the service I received last week. Despite of several phone calls, nobody has contacted me about the refund. I would be grateful if you could look into this matter and inform me about the result.",
    [["preposition", "Despite of"]],
    "despite of — yaygın hata."),

  t("B2",
    "The proposal has clear advantages, but it also carries a risk that we have not discussed. If the supplier misses the deadline again, we would have no realistic alternative, and that exposure seems too large for the benefit we expect.",
    [],
    "TEMİZ — B2 seviyesinde doğal argüman."),

  t("B2",
    "I strongly believe that this decision is very much wrong for the company. The team was not consulted and the timing could not be worse, considering that we are in the middle of a delivery.",
    [["register", "very much wrong"]],
    "'very much' sıfattan önce gelmez; ayrıca resmî metinde fazla vurgulu."),

  t("B2",
    "Thank you for the detailed feedback. I have revised the second section and removed the parts that seemed repetitive. Could you take another look when you have time this week?",
    [],
    "TEMİZ."),

  t("B2",
    "The report mentions that our costs are raising faster than expected. This is mainly because of the new supplier, whose prices increased twice in six months without any warning.",
    [["wrong_word", "raising"]],
    "rise/raise karışması."),

  t("B2",
    "There are several reasons why I think we should postpone the launch. The most important one is that the testing is not finished, and shipping something we have not verified would damage the trust we spent two years building.",
    [],
    "TEMİZ."),

  t("B2",
    "I want to make you a suggestion about the workflow. If we would divide the tasks differently, the review step would not become a bottleneck at the end of every sprint.",
    [["collocation", "make you a suggestion"], ["modal", "If we would divide"]],
    "make a suggestion → 'to' gerekiyor; if + would yerine past simple."),

  t("B2",
    "The meeting was useful, although we did not reach a final decision. Everyone agreed on the problem, which is already progress, and we will reconvene once the numbers arrive.",
    [],
    "TEMİZ."),

  // ══════════════════════ C1 ══════════════════════
  t("C1",
    "While the argument is compelling in principle, it rests on an assumption that the data does not support. The sample was drawn from a single region, and generalising from it to the whole market seems, at best, premature.",
    [],
    "TEMİZ — C1 seviyesinde nüanslı metin."),

  t("C1",
    "I would like to underline that this situation is not acceptable in any manner. We have been waiting since two months and the explanations we received until now are contradicting each other.",
    [["register", "in any manner"], ["tense", "waiting since two months"], ["preposition", "until now"]],
    "in any way; for two months; so far. Üçü de C1'de kayıt ve doğallık meselesi."),

  t("C1",
    "The distinction matters more than it first appears. A policy that merely discourages a behaviour leaves room for judgement; one that forbids it removes that room entirely, and with it the possibility of a sensible exception.",
    [],
    "TEMİZ."),

  t("C1",
    "It is worth to mention that the previous attempt failed for reasons nobody anticipated. The team had prepared thoroughly, but an external dependency changed its interface without notice.",
    [["collocation", "worth to mention"]],
    "worth mentioning — gerund gerekiyor."),

  t("C1",
    "I appreciate the thought behind the proposal, and I do not want to dismiss it out of hand. My hesitation concerns the sequencing rather than the substance: doing this before the audit closes would leave us defending two decisions at once.",
    [],
    "TEMİZ."),

  t("C1",
    "The committee has decided that the funding will be allocated according with the new criteria. Applicants which submitted before the deadline will be evaluated first, and the others in a second round.",
    [["preposition", "according with"], ["wrong_word", "Applicants which"]],
    "according to; kişi için who."),

  t("C1",
    "What strikes me about the result is not the size of the effect but its consistency. Across every subgroup we examined, the direction held, which is harder to explain away than a single large number.",
    [],
    "TEMİZ."),
];
