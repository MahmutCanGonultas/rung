/*
 * Yazım denetimi için altın küme.
 *
 * Amaç iki aracı tercihle değil **ölçerek** seçmek. Küme iki yarıdan oluşuyor:
 *
 *  - `misspelled`: Türkçe konuşanların İngilizcede gerçekten yaptığı yazım
 *    hataları. Kaynak: yaygın hata listeleri ve Türkçe kaynaklı sesletim
 *    yanılgıları (çift ünsüz düşürme, "ie/ei" karışması, "-able/-ible").
 *  - `correct`: doğru yazılmış kelimeler. İçine bilerek **çekimli hâller** ve
 *    modern kelimeler kondu — naif bir sözlük listesi tam orada yanlış alarm
 *    veriyor, ve projenin ana ölçütü yanlış alarm oranı.
 */

export const MISSPELLED = [
  "recieve", "seperate", "definately", "occured", "adress",
  "goverment", "wich", "becouse", "diffrent", "sucessful",
  "responsable", "beleive", "necesary", "enviroment", "comunication",
  "profesional", "reccomend", "acomodation", "independant", "existance",
  "buisness", "calender", "collegue", "embarass", "foriegn",
  "grammer", "immediatly", "knowlege", "maintainance", "occassion",
  "persue", "priviledge", "questionaire", "rythm", "succesfully",
  "tommorow", "untill", "wierd", "writting", "arguement",
];

export const CORRECT = [
  "receive", "separate", "definitely", "occurred", "address",
  "government", "which", "because", "different", "successful",
  "receives", "separated", "occurring", "addresses", "governments",
  "believing", "recommended", "professionally", "environments", "communications",
  "email", "emails", "website", "online", "internet",
  "smartphone", "app", "apps", "deposit", "deposits",
  "landlord", "landlords", "meeting", "meetings", "deadline",
  "deadlines", "colleague", "colleagues", "feedback", "workflow",
];
