import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"], // latin-ext: ş ğ ı İ ö ü ç
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Rung",
    template: "%s",
  },
  description: "Türkçe konuşanlar için İngilizce ölçüm aleti",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>
        {/*
          Klavyeyle gezen ve ekran okuyucu kullananlar için: her sayfada
          gezinme çubuğunu tek tek geçmek yerine doğrudan içeriğe atlama.
          Odaklanana kadar görünmüyor.
        */}
        <a className="skip" href="#main">
          İçeriğe atla
        </a>
        {children}
      </body>
    </html>
  );
}
