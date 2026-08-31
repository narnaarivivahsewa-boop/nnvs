"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import SearchBox from "@/components/SearchBox";
import FeaturedProfiles from "@/components/FeaturedProfiles";
import Stats from "@/components/Stats";
import PremiumServices from "@/components/PremiumServices";
import WhyChoose from "@/components/WhyChoose";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import AIMatchmakerModal from "@/components/AIMatchmakerModal";
import { Bot, Sparkles } from "lucide-react";

export default function Home() {
  const [aiModalOpen, setAiModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#FAF6EF] relative">
      {/* 1. Hero Banner with User Wedding Image & Original Text/CTAs */}
      <Hero />

      {/* 2. Floating Search Box with AI Matchmaker Trigger */}
      <SearchBox onOpenAIMatchmaker={() => setAiModalOpen(true)} />

      {/* 3. Community Stats */}
      <Stats />

      {/* 4. Explore Verified Profiles (Dynamic DB Profiles with Clean Format) */}
      <FeaturedProfiles />

      {/* 5. Premium Services */}
      <PremiumServices />

      {/* 6. Why Choose NNVS */}
      <WhyChoose />

      {/* 7. How It Works / Journey */}
      <HowItWorks />

      {/* 8. Footer */}
      <Footer />

      {/* Floating AI Matchmaker Action Trigger */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setAiModalOpen(true)}
          className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4A121A] via-[#5C1924] to-[#7A1F2D] p-3.5 sm:px-5 sm:py-3.5 text-white shadow-2xl transition duration-300 hover:scale-105 border-2 border-[#DFBA73] hover:shadow-red-950/40 active:scale-95"
          aria-label="Open AI Matchmaker Bot"
        >
          <div className="relative flex h-6 w-6 items-center justify-center">
            <Bot className="h-5 w-5 text-[#DFBA73] transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DFBA73] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DFBA73]" />
            </span>
          </div>
          <span className="hidden sm:inline font-serif-luxury text-xs sm:text-sm font-bold text-[#DFBA73] tracking-wide">
            AI Matchmaker ✨
          </span>
        </button>
      </div>

      {/* Interactive AI Matchmaker Bot Modal */}
      <AIMatchmakerModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
      />
    </main>
  );
}