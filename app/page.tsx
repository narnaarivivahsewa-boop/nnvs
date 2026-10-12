import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export const metadata: Metadata = {
  title: "RishteClub – Matrimony & Marriage Bureau in Delhi NCR & Haryana",
  description:
    "India's trusted matrimonial matchmaking platform. Find verified marriage, shaadi & vivah rishtey in Delhi NCR, Gurugram & Haryana. Associated with NNVS Matrimony.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RishteClub – Matrimony & Marriage Bureau in Delhi NCR & Haryana",
    description:
      "Find verified marriage, shaadi, and vivah rishtey with dignity and trust on RishteClub. Associated with NNVS Matrimony.",
    url: "https://www.rishteclub.com",
    siteName: "RishteClub Matrimony",
    locale: "en_IN",
    type: "website",
  },
};

export default function Home() {
  return <HomeClient />;
}