import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Verified Matrimonial Profiles | RishteClub",
  description:
    "Explore verified matrimonial profiles for Agarwal, Baniya, Brahmin, Punjabi, Khatri and other communities in Delhi NCR, Gurugram, Haryana & across India.",
  alternates: {
    canonical: "/profiles",
  },
  openGraph: {
    title: "Browse Verified Matrimonial Profiles | RishteClub",
    description:
      "Explore verified matrimonial profiles for Agarwal, Baniya, Brahmin, Punjabi, Khatri and other communities in Delhi NCR, Gurugram, Haryana & across India.",
    url: "https://www.rishteclub.com/profiles",
    siteName: "RishteClub Matrimony",
    locale: "en_IN",
    type: "website",
  },
};

export default function ProfilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
