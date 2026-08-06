import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "HumanLayer — ИИ нанимает людей",
  description:
    "Площадка, где искусственный интеллект даёт задания реальным людям: доставка, фото, перевод, ремонт и многое другое. Прозрачная оплата и безопасные сделки.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* App Router: подключение шрифта в корневом layout — штатно */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-navy-950 text-cream antialiased">
        <AppProvider>
          <div className="flex min-h-screen flex-col">
            <Nav />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
