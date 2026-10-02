import { ShieldCheck, HeartHandshake, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

export default function PremiumServices() {
  const services = [
    {
      title: "Verified Community Matchmaking",
      description:
        "Every profile undergoes verification before appearing in search to ensure genuine, trustworthy family alliances.",
      icon: ShieldCheck,
    },
    {
      title: "Personalized Relationship Support",
      description:
        "Dedicated assistance to help you shortlist matching profiles, initiate family conversations, and facilitate introductions.",
      icon: HeartHandshake,
    },
    {
      title: "Complete Privacy & Discretion",
      description:
        "Your contact information and personal details remain strictly confidential and are shared only with verified, interested families.",
      icon: Lock,
    },
    {
      title: "Horoscope & Community Compatibility",
      description:
        "Detailed match metrics including gotra, manglik status, educational background, and family values alignment.",
      icon: Sparkles,
    },
  ];

  return (
    <section id="services" className="py-20 bg-[#FAF6EF] border-t border-[#E8DCC8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section Heading matching the mockup line styling */}
        <div className="flex items-center justify-center gap-4 mb-14">
          <div className="hidden sm:block h-[1px] w-24 bg-gradient-to-r from-transparent to-[#C5A059]" />
          <div className="h-1.5 w-1.5 rotate-45 bg-[#C5A059]" />
          <h2 className="font-serif-luxury text-2xl sm:text-3xl md:text-4xl font-normal text-[#2D221E] tracking-normal text-center">
            Premium Services
          </h2>
          <div className="h-1.5 w-1.5 rotate-45 bg-[#C5A059]" />
          <div className="hidden sm:block h-[1px] w-24 bg-gradient-to-l from-transparent to-[#C5A059]" />
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="rounded-2xl bg-[#FAF5EB] border border-[#DACBB4] p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#C5A059] flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF0DC] text-[#4A121A] border border-[#E2D4BE] shadow-xs mb-5">
                    <Icon className="h-6 w-6 text-[#4A121A]" />
                  </div>

                  <h3 className="font-serif-luxury text-lg font-bold text-[#2D221E] leading-snug">
                    {service.title}
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm text-[#5A4E48] leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E8DCC8]">
                  <Link
                    href="/register"
                    className="inline-flex items-center text-xs font-semibold text-[#4A121A] hover:text-[#7A1F2D] transition-colors"
                  >
                    <span>Learn More</span>
                    <span className="ml-1">→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
