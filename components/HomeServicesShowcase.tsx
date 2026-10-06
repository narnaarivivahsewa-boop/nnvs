import Link from "next/link";
import {
  Calendar,
  Building2,
  UtensilsCrossed,
  Camera,
  Brush,
  Music2,
  ArrowRight,
  Store,
  Sparkles,
} from "lucide-react";

export default function HomeServicesShowcase() {
  const previewServices = [
    {
      title: "Royal Event Planning",
      desc: "End-to-end theme mandaps, floral setups & hospitality management",
      icon: Calendar,
      badge: "Launching Early 2027",
    },
    {
      title: "Heritage Venues & Palaces",
      desc: "Royal palaces, destination wedding resorts & 5-star banquet halls",
      icon: Building2,
      badge: "Partner Onboarding",
    },
    {
      title: "Gourmet Catering",
      desc: "Royal traditional feasts, live food counters & custom dessert bars",
      icon: UtensilsCrossed,
      badge: "Pure Veg Available",
    },
    {
      title: "Cinematic Photography",
      desc: "4K drone shoots, pre-wedding films & luxury wedding albums",
      icon: Camera,
      badge: "Award Winning",
    },
    {
      title: "Bridal Mehndi & Makeup",
      desc: "Celebrity makeup artists, HD airbrush & Rajasthani mehndi motifs",
      icon: Brush,
      badge: "Bridal Packages",
    },
    {
      title: "Band, Dhol & Shehnai",
      desc: "Auspicious Vedic Shehnai, symphony brass bands & Punjabi live dhols",
      icon: Music2,
      badge: "Auspicious Beats",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#FAF6EF] border-t border-[#E8DCC8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 space-y-12">
        
        {/* Section Heading */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/50 bg-[#FAF0DC] px-4 py-1 text-xs font-bold text-[#4A121A]">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Complete Wedding Services Ecosystem</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2D221E] tracking-tight">
            Grand Wedding Services & Event Planning
          </h2>

          <p className="text-xs sm:text-sm text-[#5A4E48] leading-relaxed">
            Everything your family needs for a grand, memorable wedding celebration — all under one trusted platform.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {previewServices.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={idx}
                className="rounded-3xl bg-[#FAF5EB] border border-[#DACBB4] p-6 shadow-sm hover:shadow-md transition duration-300 hover:border-[#C5A059] flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#FAF0DC] border border-[#E2D4BE] flex items-center justify-center text-[#4A121A] transition-transform group-hover:scale-110">
                      <Icon className="h-6 w-6 text-[#4A121A]" />
                    </div>
                    <span className="rounded-full bg-[#FDE8EC] text-[#7A1F2D] border border-[#F5C2CB] text-[10px] font-bold px-2.5 py-0.5">
                      {srv.badge}
                    </span>
                  </div>

                  <h3 className="font-serif-luxury text-lg font-bold text-[#2D221E] group-hover:text-[#4A121A] transition-colors">
                    {srv.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-[#5A4E48] leading-relaxed">
                    {srv.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E8DCC8] flex items-center justify-between">
                  <Link
                    href="/services"
                    className="text-xs font-bold text-[#4A121A] hover:text-[#7A1F2D] flex items-center gap-1"
                  >
                    <span>View Details & Vendors</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>

                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Coming Soon</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className="rounded-3xl bg-[#FAF0DC] border border-[#DACBB4] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-serif-luxury text-xl font-bold text-[#4A121A]">
              Are You a Wedding Planner, Caterer or Photographer?
            </h4>
            <p className="text-xs text-[#5A4E48]">
              Join RishteClub&apos;s early vendor partner network and reach thousands of verified families across India.
            </p>
          </div>

          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#4A121A] px-6 py-3 text-xs font-bold text-[#DFBA73] hover:bg-[#380D13] transition shrink-0 shadow"
          >
            <Store className="h-4 w-4" />
            <span>Join as Vendor Partner →</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
