import Link from "next/link";
import MandalaPattern from "./MandalaPattern";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#4A121A]">
      <div className="relative min-h-[520px] sm:min-h-[580px] md:min-h-[640px] w-full flex items-center">
        {/* Background Wedding Image from User Assets */}
        <div className="absolute inset-0 w-full h-full">
          <div
            className="absolute inset-0 bg-no-repeat bg-cover bg-center md:bg-[position:30%_center]"
            style={{
              backgroundImage: "url('/images/wedding/DSC00173.JPG')",
            }}
          />

          {/* Premium Gradient Overlay combining image visibility with rich theme maroon */}
          <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-black/90 via-[#4A121A]/85 to-[#4A121A] lg:from-black/75 lg:via-[#4A121A]/85 lg:to-[#4A121A]" />
          
          {/* Subtle bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#4A121A] to-transparent" />
        </div>

        {/* Decorative Golden Mandala Watermark in bottom right corner */}
        <div className="absolute -bottom-20 -right-20 pointer-events-none opacity-15 md:opacity-25 z-0">
          <MandalaPattern className="w-64 h-64 md:w-96 md:h-96 text-[#DFBA73]" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
          <div className="max-w-3xl text-left">
            {/* Jai Shree Shyam Subtitle */}
            <div className="inline-block font-serif-luxury tracking-[0.2em] sm:tracking-[0.25em] uppercase text-xs sm:text-sm font-semibold text-[#DFBA73] mb-2 sm:mb-3 drop-shadow-sm">
              🙏 JAI SHREE SHYAM 🙏
            </div>

            {/* Main Brand Title */}
            <h1 className="font-serif-luxury text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.15] tracking-tight text-white drop-shadow-md">
              RishteClub
            </h1>

            {/* Tagline */}
            <h2 className="mt-2 sm:mt-3 text-lg sm:text-2xl md:text-3xl font-serif-luxury font-semibold text-[#DFBA73] leading-snug drop-shadow-sm">
              &ldquo;Apno Ke Liye Sahi Rishta&rdquo;
            </h2>

            {/* Emotional Tagline */}
            <p className="mt-3 sm:mt-4 text-sm sm:text-lg md:text-xl font-medium text-white/95 leading-relaxed drop-shadow-sm">
              जहाँ रिश्ते जुड़ते हैं, परिवार मिलते हैं और जीवनसाथी मिलता है।
            </p>

            {/* Description Paragraph */}
            <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-[#E2D2BC] leading-relaxed max-w-2xl drop-shadow-sm">
              A trusted matrimonial matchmaking platform. An initiative associated with NNVS Matrimony – Nar Naari Vivah Sewa for genuine and verified matches.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto rounded-xl bg-white px-7 py-3.5 text-center text-sm sm:text-base font-bold text-[#4A121A] shadow-lg transition duration-200 hover:bg-[#F2E8D7] active:scale-[0.99]"
              >
                Sign In (Password)
              </Link>

              <Link
                href="/register"
                className="w-full sm:w-auto rounded-xl bg-[#C5A059] px-7 py-3.5 text-center text-sm sm:text-base font-bold text-white shadow-lg transition duration-200 hover:bg-[#B88E4C] active:scale-[0.99]"
              >
                Register Now
              </Link>

              <Link
                href="/profiles"
                className="w-full sm:w-auto rounded-xl border-2 border-white/80 bg-white/10 backdrop-blur-md px-7 py-3.5 text-center text-sm sm:text-base font-bold text-white shadow-lg transition duration-200 hover:bg-white hover:text-[#4A121A] active:scale-[0.99]"
              >
                Browse Profiles
              </Link>
            </div>

            {/* Registration Fee Info Box */}
            <div className="mt-6 sm:mt-8 w-full sm:w-auto inline-block rounded-2xl border border-white/20 bg-black/45 px-4 sm:px-5 py-3 sm:py-3.5 backdrop-blur-md">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#DFBA73]">
                Registration Fee
              </p>
              <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-x-6 gap-y-1 text-xs sm:text-sm text-gray-100">
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