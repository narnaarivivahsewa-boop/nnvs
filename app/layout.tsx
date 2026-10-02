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
  metadataBase: new URL("https://rishteclub.com"),
  title: {
    default: "RishteClub – Matrimony & Marriage Profiles | Apno Ke Liye Sahi Rishta",
    template: "%s | RishteClub",
  },
  description:
    "RishteClub is a trusted matrimonial matchmaking platform helping families and individuals find suitable life partners. An initiative associated with NNVS Matrimony – Nar Naari Vivah Sewa.",
  keywords: [
    "RishteClub",
    "RishteClub Matrimony",
    "Rishte Club",
    "Matrimony",
    "Marriage Profiles",
    "Indian Matrimony",
    "NNVS Matrimony",
    "Nar Naari Vivah Sewa",
    "Rishte",
    "Shaadi",
  ],
  alternates: {
    canonical: "https://rishteclub.com",
  },
  openGraph: {
    title: "RishteClub – Apno Ke Liye Sahi Rishta",
    description:
      "Find suitable matrimonial matches with dignity and ease on RishteClub. Associated with NNVS Matrimony.",
    url: "https://rishteclub.com",
    siteName: "RishteClub",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RishteClub – Apno Ke Liye Sahi Rishta",
    description:
      "Find suitable matrimonial matches with dignity and ease on RishteClub. Associated with NNVS Matrimony.",
  },
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