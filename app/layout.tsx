import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "احسان صالحی رباطی | متخصص IT و توسعه وب",
  description: "۱۶ سال تجربه در شبکه، وردپرس، هوش مصنوعی و پشتیبانی فنی",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-vazir bg-zinc-950 text-white">{children}</body>
    </html>
  );
}
