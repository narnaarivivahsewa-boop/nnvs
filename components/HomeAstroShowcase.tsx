import Link from "next/link";
import { Sparkles, Moon, Sun, ShieldCheck, ArrowRight, HelpCircle } from "lucide-react";

export default function HomeAstroShowcase() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-[#25050A] via-[#380D13] to-[#4A121A] text-white relative overflow-hidden border-y border-[#C5A059]/40">
      {/* Decorative starry background */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#DFBA73_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Text & Callout */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DFBA73]/40 bg-[#DFBA73]/10 px-4 py-1.5 text-xs font-semibold text-[#DFBA73] backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-[#DFBA73]" />
              <span>AI-Powered Vedic Astrology & Kundli Milan</span>
            </div>

            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Match Kundli Instantly with <span className="text-[#DFBA73]">36 Guna Ashtakoota AI</span>
            </h2>

            <p className="text-sm sm:text-base text-[#EAD8D0] leading-relaxed max-w-2xl mx-auto lg:mx-0">
              No need to wait or call! Check Manglik compatibility, Guna Milan score, planetary harmony, and ask astrological questions directly on any profile using our authentic Vedic AI algorithm.
            </p>

            {/* 3 Quick Benefit Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-3.5 text-left">
                <Sun className="h-5 w-5 text-[#DFBA73] mb-1" />
                <h3 className="text-xs font-bold text-white">36 Guna Milan</h3>
                <p className="text-[11px] text-[#D6C4BD]">Ashtakoota 8-factor Vedic score</p>
              </div>

              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-3.5 text-left">
                <ShieldCheck className="h-5 w-5 text-emerald-400 mb-1" />
                <h3 className="text-xs font-bold text-white">Manglik Dosha Check</h3>
                <p className="text-[11px] text-[#D6C4BD]">Automatic cancellation rules</p>
              </div>

              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-3.5 text-left">
                <HelpCircle className="h-5 w-5 text-[#DFBA73] mb-1" />
                <h3 className="text-xs font-bold text-white">Direct Astro Q&A</h3>
                <p className="text-[11px] text-[#D6C4BD]">Ask questions without calling</p>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                href="/astrology"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#DFBA73] px-8 py-4 text-sm font-bold text-[#300B11] shadow-xl hover:scale-105 transition"
              >
                <Moon className="h-4 w-4" />
                <span>Open Kundli Milan Tool →</span>
              </Link>
              
              <Link
                href="/profiles"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-6 py-4 text-sm font-semibold text-white hover:bg-white/20 transition"
              >
                <span>Browse Verified Profiles</span>
              </Link>
            </div>
          </div>

          {/* Right Visual Interactive Card Mockup */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-white border border-[#E2D4BE] p-6 sm:p-7 shadow-2xl text-gray-900 space-y-5">
              <div className="flex items-center justify-between border-b border-[#F2E8D7] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-[#FAF0DC] flex items-center justify-center text-[#4A121A]">
                    <Sparkles className="h-5 w-5 text-[#C5A059]" />
                  </div>
                  <div>
                    <h3 className="font-serif-luxury font-bold text-[#4A121A] text-sm sm:text-base">
                      Live Kundli Match Preview
                    </h3>
                    <p className="text-[11px] text-gray-500">Groom & Bride Astrological Sync</p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1">
                  High Match (31/36)
                </span>
              </div>

              {/* Sample Score Bars */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Graha Maitri (Mental Trust)</span>
                  <span className="font-bold text-[#4A121A]">5 / 5 pts</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-full bg-[#C5A059] rounded-full" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-gray-700">Nadi (Health & Longevity)</span>
                  <span className="font-bold text-[#4A121A]">8 / 8 pts</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-full bg-[#C5A059] rounded-full" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-gray-700">Bhakoot (Family Prosperity)</span>
                  <span className="font-bold text-[#4A121A]">7 / 7 pts</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-full bg-[#C5A059] rounded-full" />
                </div>
              </div>

              {/* Astrological Verdict Box */}
              <div className="rounded-2xl bg-[#FAF0DC] p-3.5 border border-[#DACBB4] text-xs text-[#4A121A] space-y-1">
                <span className="font-bold block">✨ Vedic Match Verdict:</span>
                <p className="text-[11px] text-[#5A4E48] leading-relaxed">
                  Excellent planetary harmony with zero Kuja Dosha. Highly auspicious match for long-term marital bliss.
                </p>
              </div>

              <Link
                href="/astrology"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4A121A] py-3 text-xs font-bold text-[#DFBA73] hover:bg-[#380D13] transition"
              >
                <span>Calculate Your Match Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
