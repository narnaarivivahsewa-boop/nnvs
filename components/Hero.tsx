import Link from "next/link";
import MandalaPattern from "./MandalaPattern";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#4A121A]">
      <div className="relative min-h-[580px] md:min-h-[640px] lg:min-h-[680px] w-full flex items-center">
        {/* Background Wedding Image from User Assets */}
        <div className="absolute inset-0 w-full h-full">
          <div
            className="absolute inset-0 bg-no-repeat bg-cover bg-center md:bg-[position:30%_center]"
            style={{
              backgroundImage: "url('/images/wedding/DSC00173.JPG')",
            }}
          />

          {/* Premium Gradient Overlay combining image visibility with rich theme maroon */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-[#4A121A]/80 to-[#4A121A]/95 lg:from-black/75 lg:via-[#4A121A]/85 lg:to-[#4A121A]" />
          
          {/* Subtle bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#4A121A] to-transparent" />
        </div>

        {/* Decorative Golden Mandala Watermark in bottom right corner */}
        <div className="absolute -bottom-20 -right-20 pointer-events-none opacity-20 md:opacity-25 z-0">
          <MandalaPattern className="w-80 h-80 md:w-96 md:h-96 text-[#DFBA73]" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 py-12 md:py-16">
          <div className="max-w-3xl text-left">
            {/* Jai Shree Shyam Subtitle */}
            <div className="inline-block font-serif-luxury tracking-[0.25em] uppercase text-xs sm:text-sm font-semibold text-[#DFBA73] mb-3 drop-shadow-sm">
              🙏 JAI SHREE SHYAM 🙏
            </div>

            {/* Main Brand Title */}
            <h1 className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.12] tracking-tight text-white drop-shadow-md">
              NNVS MATRIMONY
            </h1>

            {/* Hindi Main Tagline */}
            <h2 className="mt-3 text-xl sm:text-2xl md:text-3xl font-serif-luxury font-semibold text-[#DFBA73] leading-snug drop-shadow-sm">
              समाज के प्रति एक सेवा
            </h2>

            {/* Emotional Tagline */}
            <p className="mt-4 text-base sm:text-lg md:text-xl font-medium text-white/95 leading-relaxed drop-shadow-sm">
              जहाँ रिश्ते जुड़ते हैं, परिवार मिलते हैं और जीवनसाथी मिलता है।
            </p>

            {/* Description Paragraph */}
            <p className="mt-3 text-xs sm:text-sm md:text-base text-[#E2D2BC] leading-relaxed max-w-2xl drop-shadow-sm">
              Nar Naari Vivah Sewa के माध्यम से उपयुक्त जीवनसाथी की तलाश को सरल, विश्वसनीय और परिवार-केंद्रित बनाने का हमारा प्रयास।
            </p>

            {/* Original Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-[#C5A059] px-8 py-3.5 text-center text-sm sm:text-base font-bold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-[#B88E4C] hover:shadow-xl active:scale-[0.99]"
              >
                Register Now
              </Link>

              <Link
                href="/profiles"
                className="rounded-xl border-2 border-white/80 bg-white/10 backdrop-blur-md px-8 py-3.5 text-center text-sm sm:text-base font-bold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-[#4A121A] active:scale-[0.99]"
              >
                Browse Profiles
              </Link>
            </div>

            {/* Registration Fee Info Box */}
            <div className="mt-8 inline-block rounded-2xl border border-white/20 bg-black/40 px-5 py-3.5 backdrop-blur-md">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#DFBA73]">
                Registration Fee
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm text-gray-100">
                <span>
                  Female: <strong className="ml-1 text-[#DFBA73]">₹399 + GST</strong>
                </span>
                <span className="hidden sm:inline text-white/40">|</span>
                <span>
                  Male: <strong className="ml-1 text-[#DFBA73]">₹799 + GST</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}