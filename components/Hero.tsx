import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-[720px] overflow-hidden">

      {/* Wedding Photo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/wedding/DSC00173.JPG')",
        }}
      />

      {/* Premium Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />

      {/* Soft Bottom Fade */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />

      {/* Hero Content */}
      <div className="relative z-10 mx-auto flex min-h-[720px] max-w-7xl items-center px-6 py-20 lg:px-10">

        <div className="max-w-4xl text-white">

          {/* Jai Shree Shyam */}
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.35em] text-rose-200 sm:text-base">
            Jai Shree Shyam
          </p>

          {/* Main Heading */}
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            NNVS MATRIMONY
          </h1>

          {/* Hindi Tagline */}
          <h2 className="mt-6 text-2xl font-semibold leading-snug text-white sm:text-3xl lg:text-4xl">
            समाज के प्रति एक सेवा
          </h2>

          {/* Emotional Line */}
          <p className="mt-5 max-w-3xl text-xl font-medium leading-relaxed text-rose-50 sm:text-2xl">
            जहाँ रिश्ते जुड़ते हैं, परिवार मिलते हैं और जीवनसाथी मिलता है।
          </p>

          {/* Description */}
          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-100 sm:text-lg">
            Nar Naari Vivah Sewa के माध्यम से उपयुक्त जीवनसाथी की तलाश को
            सरल, विश्वसनीय और परिवार-केंद्रित बनाने का हमारा प्रयास।
          </p>

          {/* Buttons */}
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">

            <Link
              href="/register"
              className="rounded-full bg-red-800 px-9 py-4 text-center text-lg font-bold text-white shadow-2xl transition duration-200 hover:-translate-y-0.5 hover:bg-red-700"
            >
              Register Now
            </Link>

            <Link
              href="/profiles"
              className="rounded-full border-2 border-white bg-white/10 px-9 py-4 text-center text-lg font-bold text-white backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-red-900"
            >
              Browse Profiles
            </Link>

          </div>

          {/* Registration Fee */}
          <div className="mt-8 inline-block rounded-2xl border border-white/30 bg-black/35 px-6 py-4 backdrop-blur-md">

            <p className="text-sm font-semibold uppercase tracking-wide text-gray-200">
              Registration Fee
            </p>

            <div className="mt-2 flex flex-col gap-2 text-sm sm:flex-row sm:gap-8 sm:text-base">

              <span>
                Female:
                <strong className="ml-1 text-rose-200">
                  ₹399 + GST
                </strong>
              </span>

              <span>
                Male:
                <strong className="ml-1 text-rose-200">
                  ₹799 + GST
                </strong>
              </span>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}