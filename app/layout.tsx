import type { Metadata } from "next";
import "./globals.css";
import { vazirmatn } from "./fonts";
import Header from "./components/Header";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: {
    default: "مینی رویال | فروشگاه پوشاک کودک و نوجوان",
    template: "%s | مینی رویال",
  },
  description:
    "فروشگاه آنلاین پوشاک کودک و نوجوان مینی رویال؛ لباس‌های باکیفیت پسرانه، دخترانه و نوزاد با پرو آنلاین لباس، راهنمای سایز هوشمند و تضمین تعویض سایز.",
  keywords: [
    "پوشاک کودک",
    "لباس کودک",
    "لباس بچه گانه",
    "فروشگاه لباس نوزاد",
    "لباس مدرسه",
    "مینی رویال",
  ],
  applicationName: "مینی رویال",
  openGraph: {
    title: "مینی رویال | فروشگاه پوشاک کودک و نوجوان",
    description:
      "قبل از خرید، لباس رو تنِ بچت ببین! پرو آنلاین لباس + تضمین سایز در مینی رویال.",
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}