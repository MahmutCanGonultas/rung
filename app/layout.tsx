import type { ReactNode } from "react";

export const metadata = {
  title: "Rung",
  description: "İngilizce teşhis ve ilerleme sistemi",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
