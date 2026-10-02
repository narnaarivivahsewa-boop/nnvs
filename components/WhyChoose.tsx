import { ShieldCheck, Lock, HeartHandshake, Users } from "lucide-react";

export default function WhyChoose() {
  const features = [
    {
      icon: ShieldCheck,
      title: "Verified Matrimonial Profiles",
      desc: "Profiles are reviewed before listing to facilitate genuine and respectful family alliances.",
    },
    {
      icon: Lock,
      title: "Privacy & Data Protection",
      desc: "Your personal and contact details stay strictly confidential and protected by secure policies.",
    },
    {
      icon: HeartHandshake,
      title: "Community Focused Platform",
      desc: "RishteClub is dedicated to assisting families in discovering life partners with transparency.",
    },
    {
      icon: Users,
      title: "Direct Family Network",
      desc: "Facilitates transparent, respectful, and reliable conversations between prospective families.",
    },
  ];

  return (
    <section className="bg-[#FAF5EB] py-20 border-t border-[#E8DCC8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-block font-serif-luxury tracking-[0.18em] uppercase text-xs font-bold text-[#C5A059] mb-2">
            WHY FAMILIES CHOOSE US
          </div>

          <h2 className="font-serif-luxury text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D221E] tracking-tight">
            Why Choose RishteClub
          </h2>

          <p className="mt-3 text-sm sm:text-base text-[#5A4E48]">
            Dedicated to bringing families together with integrity, respect, and utmost transparency.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-[#FAF6EF] rounded-2xl p-6 border border-[#DACBB4] shadow-xs transition-all duration-300 hover:shadow-md hover:border-[#C5A059] flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex p-3 rounded-xl bg-[#FAF0DC] text-[#4A121A] border border-[#E2D4BE] shadow-xs">
                    <Icon className="h-6 w-6 text-[#4A121A]" />
                  </div>

                  <h3 className="mt-4 font-serif-luxury text-base sm:text-lg font-bold text-[#2D221E]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#5A4E48]">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}