import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  Compass,
  Users,
  ChevronRight,
  MapPin,
  Lock,
} from "lucide-react";
import { LANDING_PAGES } from "@/lib/constants/landing-pages";
import { BUSINESS_INFO } from "@/lib/gst";
import Footer from "@/components/Footer";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return Object.keys(LANDING_PAGES).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pageData = LANDING_PAGES[slug];

  if (!pageData) {
    return {
      title: "Matrimonial Services",
    };
  }

  return {
    title: pageData.metaTitle,
    description: pageData.metaDescription,
    alternates: {
      canonical: `/matrimony/${slug}`,
    },
    openGraph: {
      title: pageData.metaTitle,
      description: pageData.metaDescription,
      url: `https://www.rishteclub.com/matrimony/${slug}`,
      siteName: "RishteClub Matrimony",
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: "https://www.rishteclub.com/nnvs-logo.png",
          width: 800,
          height: 600,
          alt: `${pageData.title} - RishteClub`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageData.metaTitle,
      description: pageData.metaDescription,
      images: ["https://www.rishteclub.com/nnvs-logo.png"],
    },
  };
}

export default async function MatrimonyLandingPage({ params }: Props) {
  const { slug } = await params;
  const pageData = LANDING_PAGES[slug];

  if (!pageData) {
    notFound();
  }

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.rishteclub.com",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Matrimony",
        "item": "https://www.rishteclub.com/profiles",
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": pageData.title,
        "item": `https://www.rishteclub.com/matrimony/${slug}`,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": pageData.faqs.map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer,
      },
    })),
  };

  const targetFilterUrl = pageData.targetQuery?.caste
    ? `/profiles?caste=${encodeURIComponent(pageData.targetQuery.caste)}`
    : pageData.targetQuery?.query
    ? `/profiles?q=${encodeURIComponent(pageData.targetQuery.query)}`
    : "/profiles";

  return (
    <main className="min-h-screen bg-[#FAF6EF]">
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#4A121A] via-[#380D13] to-[#24060B] text-white py-16 sm:py-20">
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Auspicious Blessing */}
          <div className="inline-block font-serif-luxury tracking-[0.25em] uppercase text-xs font-semibold text-[#DFBA73] mb-3 drop-shadow-sm">
            🙏 JAI SHREE SHYAM 🙏
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="rounded-full bg-[#DFBA73]/15 border border-[#DFBA73]/30 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#DFBA73]">
              {pageData.badge}
            </span>
          </div>

          <h1 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {pageData.heading}
          </h1>

          {pageData.hindiHeading && (
            <p className="mt-2 text-base sm:text-lg font-serif-luxury text-[#DFBA73] font-medium">
              {pageData.hindiHeading}
            </p>
          )}

          <p className="mt-4 text-xs sm:text-base text-[#E2D2BC] max-w-2xl mx-auto leading-relaxed">
            {pageData.subheading}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto rounded-xl bg-[#C5A059] px-7 py-3 text-center text-sm font-bold text-white shadow-lg transition hover:bg-[#B88E4C]"
            >
              Register Profile (Free Review)
            </Link>

            <Link
              href={targetFilterUrl}
              className="w-full sm:w-auto rounded-xl border border-white/60 bg-white/10 px-7 py-3 text-center text-sm font-bold text-white backdrop-blur-md transition hover:bg-white hover:text-[#4A121A]"
            >
              Browse Filtered Profiles
            </Link>
          </div>
        </div>
      </section>

      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4 text-xs text-[#8C6239] flex items-center gap-1.5"
      >
        <Link href="/" className="hover:text-[#4A121A] transition">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-[#DACBB4]" />
        <Link href="/profiles" className="hover:text-[#4A121A] transition">
          Matrimony
        </Link>
        <ChevronRight className="h-3 w-3 text-[#DACBB4]" />
        <span className="text-[#4A121A] font-semibold">{pageData.title}</span>
      </nav>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
        {/* Overview Narrative */}
        <section className="rounded-3xl bg-[#FAF5EB] p-6 sm:p-10 border border-[#DACBB4] shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-[#C5A059]">
            <Sparkles className="h-4 w-4" />
            <span>Community & Matrimonial Heritage</span>
          </div>

          <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#4A121A]">
            About Our {pageData.title}
          </h2>

          <p className="mt-4 text-xs sm:text-base text-[#5A4E48] leading-relaxed">
            {pageData.overview}
          </p>

          <div className="mt-6 pt-6 border-t border-[#E8DCC8] flex flex-wrap items-center gap-6 text-xs text-[#5A4E48]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
              <span>100% Background-Reviewed Profiles</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#C5A059]" />
              <span>Private Contact Protection</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-[#C5A059]" />
              <span>Managed by NNVS Matrimony (Hisar, Haryana)</span>
            </div>
          </div>
        </section>

        {/* Key Features Grid */}
        <section>
          <div className="text-center mb-8">
            <span className="font-serif-luxury text-xs font-bold uppercase tracking-widest text-[#C5A059]">
              WHY FAMILIES CHOOSE US
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#2D221E] mt-1">
              Trusted Matchmaking Standards
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {pageData.keyFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white p-6 border border-[#E8DCC8] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="h-10 w-10 rounded-xl bg-[#FAF0DC] text-[#4A121A] flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-5 w-5 text-[#C5A059]" />
                  </div>
                  <h3 className="font-serif-luxury text-lg font-bold text-[#2D221E]">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#5A4E48] leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Directory Access & Registration CTA */}
        <section className="rounded-3xl bg-gradient-to-r from-[#4A121A] to-[#681825] p-6 sm:p-10 text-white shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl text-center md:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#DFBA73]">
                CONFIDENTIAL DIRECTORY ACCESS
              </span>
              <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold mt-1 text-white">
                Discover Compatible Alliances
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#E2D2BC] leading-relaxed">
                Registered profiles are verified with strict privacy safeguards. Explore matrimonial biodatas matching your community, age, education, and gotra preferences.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Link
                href="/register"
                className="w-full sm:w-auto rounded-xl bg-[#C5A059] px-6 py-3 text-center text-xs sm:text-sm font-bold text-white shadow hover:bg-[#B88E4C] transition"
              >
                Create Free Biodata
              </Link>
              <Link
                href={targetFilterUrl}
                className="w-full sm:w-auto rounded-xl bg-white px-6 py-3 text-center text-xs sm:text-sm font-bold text-[#4A121A] shadow hover:bg-[#F2E8D7] transition"
              >
                Browse All Profiles
              </Link>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="rounded-3xl bg-[#FAF5EB] p-6 sm:p-10 border border-[#DACBB4]">
          <div className="mb-6">
            <span className="font-serif-luxury text-xs font-bold uppercase tracking-widest text-[#C5A059]">
              QUESTIONS & ANSWERS
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#2D221E] mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {pageData.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white p-5 border border-[#E8DCC8] shadow-xs"
              >
                <h3 className="font-serif-luxury text-base font-bold text-[#2D221E]">
                  {faq.question}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#5A4E48] leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Other Hubs Navigation */}
        <section className="pt-4 border-t border-[#DACBB4]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#C5A059] font-serif-luxury mb-4">
            Explore Other Matrimonial Hubs
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.values(LANDING_PAGES).map((p) => (
              <Link
                key={p.slug}
                href={`/matrimony/${p.slug}`}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  p.slug === slug
                    ? "bg-[#4A121A] text-white border-[#4A121A] font-bold"
                    : "bg-white text-[#5A4E48] border-[#DACBB4] hover:border-[#C5A059] hover:text-[#4A121A]"
                }`}
              >
                {p.title}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
