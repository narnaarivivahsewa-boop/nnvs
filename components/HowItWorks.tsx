import Link from "next/link";

const steps = [
  {
    icon: "🔎",
    title: "Find Your Match",
    description: "Browse suitable profiles and discover your perfect match with smart filters.",
    href: "/profiles",
    button: "Browse Profiles",
  },
  {
    icon: "📝",
    title: "Create Profile",
    description: "Register and create your matrimonial biodata with complete family details.",
    href: "/register",
    button: "Register Now",
  },
  {
    icon: "💌",
    title: "Connect & Converse",
    description: "Explore suitable profiles and connect with families with complete dignity.",
    href: "/contact",
    button: "Contact Us",
  },
  {
    icon: "🤝",
    title: "Begin Your Journey",
    description: "Take the auspicious next step towards finding your life partner and happiness.",
    href: "/register",
    button: "Start Journey",
  },
];

export default function HowItWorks() {
  return (
    <section id="stories" className="bg-[#FAF6EF] px-4 sm:px-6 lg:px-10 py-20 border-t border-[#E8DCC8]">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-14 text-center">
          <p className="mb-2 font-serif-luxury text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
            SIMPLE & SACRED JOURNEY
          </p>

          <h2 className="font-serif-luxury text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D221E]">
            How It Works
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-[#5A4E48]">
            A simple, transparent path from creating your profile to meeting suitable prospective families.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-[#DACBB4] bg-[#FAF5EB] p-6 text-center shadow-xs transition-all duration-300 hover:shadow-md hover:border-[#C5A059] flex flex-col justify-between"
            >
              {/* Step Number */}
              <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#C5A059] text-xs font-bold text-white shadow-xs">
                {index + 1}
              </div>

              <div>
                {/* Icon */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF0DC] text-3xl shadow-inner border border-[#E2D4BE]">
                  {step.icon}
                </div>

                {/* Title */}
                <h3 className="mt-5 font-serif-luxury text-lg font-bold text-[#2D221E]">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#5A4E48]">
                  {step.description}
                </p>
              </div>

              {/* Button */}
              <div className="mt-6 pt-4 border-t border-[#E8DCC8]">
                <Link
                  href={step.href}
                  className="inline-flex items-center justify-center rounded-lg bg-[#4A121A] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#3A0C13]"
                >
                  <span>{step.button}</span>
                  <span className="ml-1.5">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Auspicious Banner CTA */}
        <div className="mt-14 rounded-2xl bg-[#4A121A] px-6 py-10 text-center shadow-lg border border-[#6B1F2D]">
          <h3 className="font-serif-luxury text-xl sm:text-2xl md:text-3xl font-bold text-white">
            Ready to Find Your Life Partner?
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-[#E2D2BC]">
            Register with RishteClub today and take the first step towards finding your life partner.
          </p>

          <div className="mt-6">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-[#C5A059] px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#B88E4C] hover:scale-105"
            >
              <span>Register Now</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}