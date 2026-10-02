import Link from "next/link";
import { BUSINESS_INFO } from "@/lib/gst";
import { ShieldCheck, HeartHandshake, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FAF6EF] py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center">
          <span className="font-serif-luxury text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
            DISCOVER OUR STORY
          </span>
          <h1 className="font-serif-luxury text-3xl sm:text-5xl font-extrabold text-[#4A121A] mt-2">
            About RishteClub
          </h1>
          <p className="mt-2 text-base sm:text-lg font-serif-luxury font-semibold text-[#8C6239]">
            &ldquo;{BUSINESS_INFO.tagline}&rdquo;
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-sm sm:text-base text-[#5A4E48] leading-relaxed">
            RishteClub is a trusted matrimonial platform designed to help families and individuals discover suitable life partners with transparency, privacy, and simplicity.
          </p>
        </div>

        {/* Auspicious Banner */}
        <div className="my-8 py-3 text-center bg-[#FAF5EB] rounded-2xl border border-[#DACBB4]">
          <p className="text-lg font-bold text-[#4A121A]">
            🙏 जय श्री श्याम 🙏
          </p>
        </div>

        {/* Narrative Card */}
        <div className="rounded-3xl bg-[#FAF5EB] p-6 sm:p-10 md:p-12 shadow-md border border-[#DACBB4]">
          <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#4A121A]">
            हमारे बारे में (About Us)
          </h2>

          <p className="mt-5 text-sm sm:text-base leading-relaxed text-[#5A4E48]">
            <strong>RishteClub</strong> का उद्देश्य विवाह योग्य युवक-युवतियों एवं उनके परिवारों को एक विश्वसनीय और आधुनिक माध्यम उपलब्ध कराना है, जहाँ वे अपनी प्राथमिकताओं और पारिवारिक मूल्यों के अनुसार उपयुक्त जीवनसाथी की तलाश कर सकें।
          </p>

          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#5A4E48]">
            हमारा प्रयास है कि matrimonial profiles को व्यवस्थित एवं सम्मानजनक तरीके से प्रस्तुत किया जाए तथा परिवारों को आपस में संपर्क करने का सुरक्षित माध्यम मिले।
          </p>

          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-[#FAF0DC] border border-[#DFBA73]">
            <p className="text-xs sm:text-sm font-semibold text-[#4A121A]">
              🤝 An Initiative Associated with {BUSINESS_INFO.associatedBrand}
            </p>
            <p className="mt-1 text-xs text-[#6B4F3B] leading-relaxed">
              RishteClub operates in continuation with the respected legacy of NNVS Matrimony, carrying forward the community-driven trust and service ethics built over the years.
            </p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl bg-[#FAF5EB] p-6 sm:p-8 shadow-sm border border-[#DACBB4]">
            <div className="inline-flex p-3 rounded-xl bg-[#FAF0DC] text-[#4A121A] border border-[#E2D4BE] mb-4">
              <Award className="h-6 w-6 text-[#4A121A]" />
            </div>
            <h3 className="font-serif-luxury text-xl font-bold text-[#4A121A]">
              हमारा उद्देश्य (Our Mission)
            </h3>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#5A4E48]">
              योग्य matrimonial profiles को एक सुरक्षित मंच पर उपलब्ध कराना और परिवारों को उपयुक्त रिश्ते तलाशने में सहायता करना।
            </p>
          </div>

          <div className="rounded-3xl bg-[#FAF5EB] p-6 sm:p-8 shadow-sm border border-[#DACBB4]">
            <div className="inline-flex p-3 rounded-xl bg-[#FAF0DC] text-[#4A121A] border border-[#E2D4BE] mb-4">
              <HeartHandshake className="h-6 w-6 text-[#4A121A]" />
            </div>
            <h3 className="font-serif-luxury text-xl font-bold text-[#4A121A]">
              हमारा प्रयास (Our Commitment)
            </h3>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#5A4E48]">
              सरल, व्यवस्थित और परिवार-केंद्रित matrimonial experience उपलब्ध कराना ताकि रिश्ता तलाशने की प्रक्रिया आसान और गरिमामयी हो।
            </p>
          </div>
        </div>

        {/* Legal & Business Entity Info Box */}
        <div className="mt-8 rounded-3xl bg-[#FAF5EB] p-6 sm:p-8 shadow-sm border border-[#DACBB4]">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-[#C5A059]" />
            <h3 className="font-serif-luxury text-xl font-bold text-[#4A121A]">
              Legal & Business Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-[#5A4E48]">
            <div className="p-3 bg-white rounded-xl border border-[#E8DCC8]">
              <span className="block text-[11px] font-bold text-[#8C6239] uppercase">Brand</span>
              <span className="font-semibold text-[#2D221E]">{BUSINESS_INFO.brandName}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E8DCC8]">
              <span className="block text-[11px] font-bold text-[#8C6239] uppercase">Associated Brand</span>
              <span className="font-semibold text-[#2D221E]">{BUSINESS_INFO.associatedBrand}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E8DCC8]">
              <span className="block text-[11px] font-bold text-[#8C6239] uppercase">Proprietor</span>
              <span className="font-semibold text-[#2D221E]">{BUSINESS_INFO.proprietor}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E8DCC8]">
              <span className="block text-[11px] font-bold text-[#8C6239] uppercase">Trade Name</span>
              <span className="font-semibold text-[#2D221E]">{BUSINESS_INFO.tradeName}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E8DCC8] sm:col-span-2">
              <span className="block text-[11px] font-bold text-[#8C6239] uppercase">GSTIN</span>
              <span className="font-semibold text-[#2D221E] font-mono">{BUSINESS_INFO.gstin}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#4A121A]">
            अपने लिए उपयुक्त रिश्ता तलाशें
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#5A4E48]">
            Explore verified profiles on RishteClub today.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/profiles"
              className="rounded-xl bg-[#4A121A] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#3A0C13] shadow-sm"
            >
              Browse Profiles
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[#C5A059] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#B88E4C] shadow-sm"
            >
              Register Now
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}