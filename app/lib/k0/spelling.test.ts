import assert from "node:assert/strict";
import test from "node:test";

import { findMisspellings } from "./spelling.ts";

const flagged = (text: string) => findMisspellings(text).map((m) => m.word);

test("doğru yazılmış metinde hiçbir şey işaretlenmiyor", () => {
  assert.deepEqual(
    flagged("I am writing to ask about the deposit for the flat I rented."),
    []
  );
});

test("yazım hatasını buluyor", () => {
  assert.deepEqual(flagged("I recieved your adress yesterday."), [
    "recieved",
    "adress",
  ]);
});

test("düzeltme öneriyor", () => {
  const [first] = findMisspellings("I recieved it.");
  assert.ok(first.suggestions.includes("received"), first.suggestions.join(", "));
});

test("konum metne çapalanıyor", () => {
  const text = "I recieved it.";
  const [first] = findMisspellings(text);
  assert.equal(text.slice(first.start, first.end), "recieved");
});

test("çekimli hâller yanlış alarm vermiyor", () => {
  assert.deepEqual(
    flagged("She receives letters, separated files and recurring meetings."),
    []
  );
});

test("modern kelimeler yanlış alarm vermiyor", () => {
  assert.deepEqual(flagged("I sent an email from my smartphone website app."), []);
});

test("cümle ortasındaki özel isim atlanıyor", () => {
  assert.deepEqual(flagged("I met Mahmut and Ayse in Kadikoy yesterday."), []);
});

test("kısaltmalar atlanıyor", () => {
  assert.deepEqual(flagged("Send the PDF to the API team at NASA."), []);
});

test("cümle başındaki gerçek hata yakalanıyor", () => {
  assert.deepEqual(flagged("Recieve the package tomorrow."), ["Recieve"]);
});

test("boş metin çökmüyor", () => {
  assert.deepEqual(flagged(""), []);
});

test("gerçekçi paragrafta yanlış alarm yok", () => {
  const paragraph =
    "Dear Sarah, I am writing to inform you that I have finished the research " +
    "about the pricing issue. I agree with your suggestion, but I think we " +
    "should discuss the details in tomorrow's meeting. Please let me know " +
    "which time works for you. Best regards, Mahmut";
  assert.deepEqual(flagged(paragraph), []);
});

test("İNGİLİZ yazımı yanlış alarm vermiyor", () => {
  // İlk gerçek eval koşumundaki yedi yanlış alarmın beşi buydu.
  assert.deepEqual(
    flagged(
      "My favourite neighbours discussed the behaviour of the organisation " +
        "and used their own judgement while generalising from the colour of it."
    ),
    []
  );
});

test("Amerikan yazımı da yanlış alarm vermiyor", () => {
  assert.deepEqual(
    flagged(
      "My favorite neighbors discussed the behavior of the organization " +
        "and used their own judgment while generalizing from the color of it."
    ),
    []
  );
});

test("iki sözlük de gerçek hatayı yakalıyor", () => {
  assert.deepEqual(flagged("I recieved the adress yesterday."), ["recieved", "adress"]);
});
