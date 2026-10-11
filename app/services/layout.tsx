import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedding Services & Event Planning | RishteClub",
  description:
    "End-to-end wedding event planners, royal decor, bridal makeup, catering and photography vendors in Delhi NCR & Haryana. Managed by NNVS Matrimony.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Wedding Services & Event Planning | RishteClub",
    description:
      "End-to-end wedding event planners, royal decor, bridal makeup, catering and photography vendors in Delhi NCR & Haryana.",
    url: "https://www.rishteclub.com/services",
    siteName: "RishteClub Matrimony",
    locale: "en_IN",
    type: "website",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
