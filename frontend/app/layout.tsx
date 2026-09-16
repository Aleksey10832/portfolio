import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Алексей Куратов — веб-разработчик",
  description:
    "Портфолио Алексея Куратова (Aleksey10832): навыки, опыт работы и пэт-проекты.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}