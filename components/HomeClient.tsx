"use client";

import Hero from "@/components/Hero";
import SearchBox from "@/components/SearchBox";
import FeaturedProfiles from "@/components/FeaturedProfiles";
import Stats from "@/components/Stats";
import HomeAstroShowcase from "@/components/HomeAstroShowcase";
import HomeServicesShowcase from "@/components/HomeServicesShowcase";
import PremiumServices from "@/components/PremiumServices";
import WhyChoose from "@/components/WhyChoose";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

export default function HomeClient() {
  return (
    <main className="min-h-screen bg-[#FAF6EF] relative">
      {/* 1. Hero Banner with User Wedding Image & Original Text/CTAs */}
      <Hero />

      {/* 2. Search Box */}
      <SearchBox />

      {/* 3. Community Stats */}
      <Stats />

      {/* 4. AI Kundli & Vedic Astrology Showcase Banner */}
      <HomeAstroShowcase />

      {/* 5. Explore Verified Profiles (Dynamic DB Profiles with Clean Format) */}
      <FeaturedProfiles />

      {/* 6. Grand Wedding Services & Event Planner Showcase */}
      <HomeServicesShowcase />

      {/* 7. Premium Services */}
      <PremiumServices />

      {/* 8. Why Choose NNVS */}
      <WhyChoose />

      {/* 9. How It Works / Journey */}
      <HowItWorks />

      {/* 10. Footer */}
      <Footer />
    </main>
  );
}
