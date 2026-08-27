import { redirect } from "next/navigation";

/*
 * Pano silindi.
 *
 * Gösterdiği her şey başka bir ekranda zaten vardı: seviye kartı ve son kayıt
 * listesi "Kayıtlar"da, sayaçlar "İlerleme"de. Beş hedefli bir çubukta iki
 * hedefin aynı şeyi göstermesi, içerinin karışık hissettirmesinin ölçülebilir
 * sebeplerinden biriydi.
 *
 * Adres duruyor ve yönlendiriyor: dışarıda kalmış bağlantılar, yer imleri ve
 * eski oturumlar kırılmasın. Giriş yapan kişi artık doğrudan YAPACAĞI ŞEYE
 * düşüyor.
 */
export default function DashboardPage() {
  redirect("/write");
}
