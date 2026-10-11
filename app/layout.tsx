import type { Metadata, Viewport } from "next";
import { Playfair_Display, Cinzel, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PwaRegister from "@/components/PwaRegister";

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
  metadataBase: new URL("https://www.rishteclub.com"),
  title: {
    default: "RishteClub – Matrimony & Marriage Profiles | Apno Ke Liye Sahi Rishta | NNVS Matrimony",
    template: "%s | RishteClub Matrimony",
  },
  description:
    "RishteClub (by NNVS Matrimony - Nar Naari Vivah Sewa) is India's trusted matchmaking platform for verified marriage, shaadi, and vivah rishtey. Find suitable Agarwal, Baniya, Brahmin, Punjabi, Khatri & other community life partner profiles.",
  keywords: [
    "Matrimony",
    "Marriage",
    "Shaadi",
    "Rishta",
    "Rishtey",
    "Vivah",
    "RishteClub",
    "Rishte Club",
    "RishteClub Matrimony",
    "NNVS Matrimony",
    "Nar Naari Vivah Sewa",
    "Marriage Bureau",
    "Best Matrimony Website in India",
    "Shaadi Profiles",
    "Hindu Matrimony",
    "Baniya Matrimony",
    "Agarwal Rishtey",
    "Brahmin Matrimony",
    "Punjabi Matrimony",
    "Khatri Rishtey",
    "Delhi NCR Matrimony",
    "Free Matrimonial Registration",
    "Kundli Milan",
    "Astrology Marriage Match",
    "Verified Bride and Groom Profiles",
    "Apno Ke Liye Sahi Rishta",
  ],
  authors: [{ name: "RishteClub Managed by NNVS Matrimony" }],
  creator: "RishteClub",
  publisher: "Trendy Traders",
  formatDetection: {
    telephone: true,
    email: true,
  },
  openGraph: {
    title: "RishteClub – Matrimony & Marriage Profiles | Apno Ke Liye Sahi Rishta",
    description:
      "Find verified marriage, shaadi, and vivah rishtey with dignity and trust on RishteClub. Associated with NNVS Matrimony.",
    url: "https://www.rishteclub.com",
    siteName: "RishteClub Matrimony",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://www.rishteclub.com/nnvs-logo.png",
        width: 800,
        height: 600,
        alt: "RishteClub Matrimony - Apno Ke Liye Sahi Rishta",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RishteClub – Matrimony & Marriage Profiles | Apno Ke Liye Sahi Rishta",
    description:
      "Find verified marriage, shaadi, and vivah rishtey with dignity and trust on RishteClub. Associated with NNVS Matrimony.",
    images: ["https://www.rishteclub.com/nnvs-logo.png"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RishteClub",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/nnvs-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4A121A",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.rishteclub.com/#website",
      "url": "https://www.rishteclub.com",
      "name": "RishteClub",
      "alternateName": [
        "RishteClub Matrimony",
        "NNVS Matrimony",
        "Nar Naari Vivah Sewa",
        "Rishte Club",
      ],
      "description": "India's trusted matrimonial platform for marriage, shaadi & vivah rishtey.",
      "publisher": {
        "@id": "https://www.rishteclub.com/#organization",
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.rishteclub.com/profiles?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
      "inLanguage": ["en-IN", "hi"],
    },
    {
      "@type": "Organization",
      "@id": "https://www.rishteclub.com/#organization",
      "name": "RishteClub Matrimony",
      "legalName": "Trendy Traders",
      "alternateName": ["NNVS Matrimony", "Nar Naari Vivah Sewa", "Rishte Club"],
      "url": "https://www.rishteclub.com",
      "logo": "https://www.rishteclub.com/nnvs-logo.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-9871592002",
        "contactType": "customer service",
        "areaServed": "IN",
        "availableLanguage": ["Hindi", "English"],
      },
      "sameAs": [
        "https://wa.me/919871592002",
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://www.rishteclub.com/#localbusiness",
      "name": "RishteClub - Nar Naari Vivah Sewa Matrimonial Bureau",
      "image": "https://www.rishteclub.com/nnvs-logo.png",
      "telephone": "+91-9871592002",
      "priceRange": "₹399 - ₹799",
      "taxID": "06APYPD6931J1ZE",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "6/34, Near Guru Kirpa Bister House, Patel Nagar",
        "addressLocality": "Hisar",
        "addressRegion": "Haryana",
        "postalCode": "125001",
        "addressCountry": "IN",
      },
      "serviceArea": "India",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Matrimonial & Wedding Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Matrimonial Matchmaking (Rishtey)",
            },
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Vedic Kundli Milan & Astrology Consultation",
            },
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Wedding Event Planning & Vendor Booking",
            },
          },
        ],
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${playfair.variable} ${cinzel.variable} ${jakarta.variable} h-full antialiased overflow-x-hidden`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full bg-[#FAF6EF] text-[#2D221E] font-sans overflow-x-hidden"
      >
        <PwaRegister />
        <Navbar />
        {children}
      </body>
    </html>
  );
}