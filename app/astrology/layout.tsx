import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Kundli Milan & Vedic Horoscope Match | RishteClub",
  description:
    "Free 36 Guna Ashtakoota Milan, Manglik dosha analysis and Lal Kitab remedial guidance for marriage compatibility. Associated with NNVS Matrimony.",
  alternates: {
    canonical: "/astrology",
  },
  openGraph: {
    title: "AI Kundli Milan & Vedic Horoscope Match | RishteClub",
    description:
      "Free 36 Guna Ashtakoota Milan, Manglik dosha analysis and Lal Kitab remedial guidance for marriage compatibility.",
    url: "https://www.rishteclub.com/astrology",
    siteName: "RishteClub Matrimony",
    locale: "en_IN",
    type: "website",
  },
};

export default function AstrologyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
