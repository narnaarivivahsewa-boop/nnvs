import type { Metadata, Viewport } from "next";
import { Playfair_Display, Cinzel, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NNVS Matrimony - Your Journey to a Perfect Match Begins Here",
  description: "NNVS Matrimony - Premium Matchmaking for Discerning Individuals. समाज के प्रति एक सेवा.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4A121A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${cinzel.variable} ${jakarta.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full bg-[#FAF6EF] text-[#2D221E] font-sans overflow-x-hidden">
        <Navbar />
        {children}
      </body>
    </html>
  );
}