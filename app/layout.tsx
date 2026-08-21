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
      <body>{children}</body>
    </html>
  );
}
