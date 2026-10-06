"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  UtensilsCrossed,
  Building2,
  Camera,
  Music2,
  Brush,
  Mail,
  Car,
  Gem,
  Bell,
  CheckCircle2,
  Store,
  ShieldCheck,
  ChevronRight,
  X,
  Phone,
  Send,
  Gift,
  Tag,
  Clock,
  ArrowRight,
} from "lucide-react";
import Footer from "@/components/Footer";

export default function ServicesPage() {
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("Event Planner & Management");

  // Vendor Registration State
  const [vendorName, setVendorName] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorCity, setVendorCity] = useState("");
  const [vendorExperience, setVendorExperience] = useState("");
  const [vendorSubmitted, setVendorSubmitted] = useState(false);

  // Client Privilege Voucher State
  const [clientName, setClientName] = useState("");
  const [clientMobile, setClientMobile] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [clientBudget, setClientBudget] = useState("₹2,00,000 - ₹5,00,000");
  const [voucherSubmitted, setVoucherSubmitted] = useState(false);
  const [generatedVoucherCode, setGeneratedVoucherCode] = useState("");

  const [notifiedCategory, setNotifiedCategory] = useState<string | null>(null);

  const weddingServices = [
    {
      id: "event-planner",
      title: "Royal Event Planning & Decor",
      hindiTitle: "इवेंट प्लानर एवं मंडप डेकोर",
      description:
        "End-to-end wedding theme design, royal mandap setups, floral installations, sangeet choreography, and personalized event management.",
      icon: Calendar,
      tag: "Top Rated",
      badge: "Launching Early 2027",
      features: ["Theme Mandap & Entry Decor", "Hospitality & Guest Flow", "Sangeet & Entertainment Direction"],
    },
    {
      id: "venues",
      title: "Heritage Venues & Royal Palaces",
      hindiTitle: "शाही वेन्यू, बैंक्वेट एवं फार्महाउस",
      description:
        "Exclusive handpicked royal destination palaces, 5-star luxury banquets, lush green farmhouses, and heritage heritage hotels.",
      icon: Building2,
      tag: "Luxury Collection",
      badge: "Partner Onboarding",
      features: ["Destination Wedding Palaces", "Luxury Air-Conditioned Banquets", "Lush Lawn Farmhouses"],
    },
    {
      id: "catering",
      title: "Gourmet Catering & Royal Feasts",
      hindiTitle: "प्रीमियम कैटरिंग एवं शाही भोजन",
      description:
        "Authentic vegetarian and traditional delicacies, royal thali presentations, live interactive counters, and custom mithai curation.",
      icon: UtensilsCrossed,
      tag: "Pure Veg Available",
      badge: "Coming Soon",
      features: ["Traditional & Multi-Cuisine Counters", "Luxury Silverware Presentation", "Signature Dessert Counters"],
    },
    {
      id: "photography",
      title: "Cinematic Photography & Films",
      hindiTitle: "वेडिंग फोटोग्राफी एवं सिनेमैटिक शूट",
      description:
        "High-definition 4K cinematic wedding teasers, royal pre-wedding shoots, drone aerial cinematography, and luxury coffee-table albums.",
      icon: Camera,
      tag: "Award Winning",
      badge: "Coming Soon",
      features: ["4K Drone Aerial Coverage", "Candid & Royal Portraiture", "Same-Day Edit Highlights"],
    },
    {
      id: "mehndi-makeup",
      title: "Bridal Mehndi & Makeup Artists",
      hindiTitle: "ब्राइडल मेहंदी एवं मेकअप आर्टिस्ट",
      description:
        "Celebrity bridal makeup artists, HD airbrush makeover, organic bridal mehndi with intricate Rajasthani and Marwari motifs.",
      icon: Brush,
      tag: "Celebrity Artists",
      badge: "Coming Soon",
      features: ["HD Airbrush Makeup", "Intricate Bridal Mehndi Patterns", "Pre-Bridal Skin Care Packages"],
    },
    {
      id: "band-music",
      title: "Band, Baaja, Dhol & Shehnai",
      hindiTitle: "शाही बैंड, शहनाई एवं डीजे संगीत",
      description:
        "Auspicious Shehnai musicians, brass symphony bands, Punjabi live dhols, vintage vintage chariots, and sound setups.",
      icon: Music2,
      tag: "Auspicious Beats",
      badge: "Coming Soon",
      features: ["Vedic Shehnai & Nagada", "Royal Vintage Baggi & Chariots", "Live Symphony Brass Band"],
    },
    {
      id: "invites",
      title: "Luxury E-Invites & Stationery",
      hindiTitle: "शाही पत्रिका एवं डिजिटल आमंत्रण",
      description:
        "Gold-embossed royal wedding card designs, WhatsApp animated video invitations, custom wax seals, and personalized guest portals.",
      icon: Mail,
      tag: "Bespoke Design",
      badge: "Coming Soon",
      features: ["Gold Embossed Hardcover Box", "Animated WhatsApp Video Invites", "Custom RSVP Tracking"],
    },
    {
      id: "cars-fleet",
      title: "Luxury Bridal Fleet & Vintage Cars",
      hindiTitle: "शाही विंटेज कार एवं लक्ज़री फ्लीट",
      description:
        "Rolls-Royce, Mercedes, Audi, and vintage convertible vintage cars decorated with fresh blooms for grand groom entries and vidaai.",
      icon: Car,
      tag: "Royal Entry",
      badge: "Coming Soon",
      features: ["Vintage Convertible Cars", "Luxury Sedans & SUVs", "Floral Car Decoration Included"],
    },
    {
      id: "couture",
      title: "Royal Bridal & Groom Couture",
      hindiTitle: "राजसी दूल्हा-दुल्हन पोशाक व ज्वेलरी",
      description:
        "Handcrafted bridal lehengas, royal sherwanis, turban safas, kundan jewelry styling, and personalized fashion consulting.",
      icon: Gem,
      tag: "Designer Wear",
      badge: "Coming Soon",
      features: ["Handcrafted Zardozi Lehengas", "Royal Imperial Sherwanis", "Kundan & Polki Jewelry Sets"],
    },
  ];

  function handleVendorRegister(e: React.FormEvent) {
    e.preventDefault();
    setVendorSubmitted(true);
    setTimeout(() => {
      setPartnerModalOpen(false);
      setVendorSubmitted(false);
      setVendorName("");
      setVendorPhone("");
      setVendorCity("");
      setVendorExperience("");
    }, 2500);
  }

  function handleGenerateVoucher(e: React.FormEvent) {
    e.preventDefault();
    const code = `RC-PRIV-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedVoucherCode(code);
    setVoucherSubmitted(true);
  }

  function handleNotifyMe(serviceTitle: string) {
    setNotifiedCategory(serviceTitle);
    setTimeout(() => setNotifiedCategory(null), 3000);
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex flex-col font-sans">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#4A121A] via-[#380D13] to-[#25050A] text-white py-16 sm:py-20 border-b border-[#C5A059]/40">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#DFBA73_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DFBA73]/50 bg-[#DFBA73]/10 px-4 py-1.5 text-xs font-semibold text-[#DFBA73] backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-[#DFBA73]" />
            <span>Complete Wedding Services Ecosystem</span>
          </div>

          <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Grand Wedding Services & Event Planning
          </h1>

          <p className="mx-auto max-w-3xl text-sm sm:text-base text-[#EAD8D0] leading-relaxed">
            From royal venues and gourmet catering to cinematic photography and expert event planners — RishteClub is expanding into a single-destination wedding platform for every auspicious celebration.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setPartnerModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#DFBA73] px-7 py-3.5 text-sm font-bold text-[#300B11] shadow-lg transition hover:scale-105"
            >
              <Store className="h-4 w-4" />
              <span>Register as Wedding Vendor / Partner</span>
            </button>

            <button
              onClick={() => {
                setSelectedService("Royal Event Planning & Decor");
                setVoucherModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <Gift className="h-4 w-4 text-[#DFBA73]" />
              <span>Claim ₹5,000 Privilege Voucher</span>
            </button>
          </div>
        </div>
      </section>

      {/* Notification Toast */}
      {notifiedCategory && (
        <div className="fixed top-24 right-6 z-50 rounded-2xl bg-emerald-700 text-white px-5 py-3 shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-xs font-bold">
            Alert saved for &ldquo;{notifiedCategory}&rdquo;! We will notify you when vendors go live.
          </span>
        </div>
      )}

      {/* Services Grid Section */}
      <main className="flex-1 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="font-serif-luxury text-2xl sm:text-4xl font-bold text-[#4A121A]">
              Explore Upcoming Wedding Services
            </h2>
            <p className="text-xs sm:text-sm text-[#5A4E48] max-w-xl mx-auto">
              Click &ldquo;Request Quotation & Voucher&rdquo; to connect with verified vendors or register your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {weddingServices.map((srv) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.id}
                  className="rounded-3xl bg-white border border-[#E2D4BE] p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:border-[#C5A059]"
                >
                  <div className="space-y-4">
                    {/* Card Top Row */}
                    <div className="flex items-start justify-between">
                      <div className="h-14 w-14 rounded-2xl bg-[#FAF0DC] border border-[#E2D4BE] flex items-center justify-center text-[#4A121A] transition-transform group-hover:scale-110">
                        <Icon className="h-7 w-7 text-[#4A121A]" />
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded-full bg-[#FAF0DC] border border-[#DACBB4] px-3 py-1 text-[11px] font-bold text-[#4A121A]">
                          {srv.tag}
                        </span>
                        <span className="rounded-full bg-[#FDE8EC] border border-[#F5C2CB] px-2.5 py-0.5 text-[10px] font-bold text-[#7A1F2D]">
                          {srv.badge}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-serif-luxury text-xl font-bold text-[#2D221E] group-hover:text-[#4A121A] transition-colors">
                        {srv.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#7A5835] mt-0.5">
                        {srv.hindiTitle}
                      </p>
                      <p className="text-xs sm:text-sm text-[#5A4E48] mt-2.5 leading-relaxed">
                        {srv.description}
                      </p>
                    </div>

                    {/* Feature Bullets */}
                    <div className="pt-2 space-y-1.5 border-t border-[#F2E8D7]">
                      {srv.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-[#4A3E39]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#C5A059] shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-6 border-t border-[#E8DCC8] mt-6 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedService(srv.title);
                        setVoucherModalOpen(true);
                      }}
                      className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#4A121A] bg-white py-2.5 text-xs font-bold text-[#4A121A] hover:bg-[#FAF0DC] transition"
                    >
                      <Gift className="h-3.5 w-3.5 text-[#C5A059]" />
                      <span>Request Quote</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedService(srv.title);
                        setPartnerModalOpen(true);
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 rounded-xl bg-[#4A121A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#380D13] transition shadow-xs"
                    >
                      <span>Join as Vendor</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vendor Onboarding Highlight Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-[#4A121A] via-[#5C1924] to-[#380D13] p-8 sm:p-12 text-white border-2 border-[#C5A059]/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left max-w-2xl">
              <span className="rounded-full bg-[#DFBA73]/20 border border-[#DFBA73]/40 px-3.5 py-1 text-xs font-bold text-[#DFBA73] inline-block">
                ✨ Are You a Wedding Professional?
              </span>
              <h3 className="font-serif-luxury text-2xl sm:text-4xl font-bold text-white">
                Grow Your Wedding Business with RishteClub
              </h3>
              <p className="text-xs sm:text-sm text-[#EAD8D0] leading-relaxed">
                Connect directly with thousands of verified families and prospective brides & grooms planning their weddings. Zero commission on early onboarding!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPartnerModalOpen(true)}
              className="rounded-2xl bg-[#DFBA73] hover:bg-[#C5A059] text-[#300B11] font-bold text-sm px-8 py-4 shadow-xl transition hover:scale-105 shrink-0"
            >
              Partner With Us Today →
            </button>
          </div>

        </div>
      </main>

      {/* Client Privilege Voucher & Quote Request Modal */}
      {voucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-[#E2D4BE] p-6 sm:p-8 shadow-2xl space-y-5 animate-scaleUp">
            <button
              onClick={() => {
                setVoucherModalOpen(false);
                setVoucherSubmitted(false);
              }}
              className="absolute top-4 right-4 rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 transition"
            >
              <X className="h-4 w-4" />
            </button>

            {voucherSubmitted ? (
              <div className="py-6 text-center space-y-4">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Gift className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-700 uppercase">Voucher Generated</span>
                  <h3 className="font-serif-luxury text-2xl font-bold text-[#4A121A]">
                    ₹5,000 Privilege Pass
                  </h3>
                </div>

                {/* Voucher Passcode Box */}
                <div className="rounded-2xl bg-[#FAF0DC] border-2 border-dashed border-[#C5A059] p-4 text-center space-y-1">
                  <span className="text-xs text-[#7A5835] font-semibold block">Your Official Booking Code:</span>
                  <p className="font-mono text-2xl font-black text-[#4A121A] tracking-wider">
                    {generatedVoucherCode}
                  </p>
                  <span className="text-[11px] text-gray-500 block">Category: {selectedService}</span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                  Thank you, <strong>{clientName}</strong>. Our wedding relations concierge has assigned this booking code to verified vendors in <strong>{clientCity}</strong>. You will receive customized quotes on WhatsApp: <strong>{clientMobile}</strong>.
                </p>

                <button
                  type="button"
                  onClick={() => setVoucherModalOpen(false)}
                  className="w-full rounded-2xl bg-[#4A121A] py-3 text-xs font-bold text-white hover:bg-[#380D13] transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateVoucher} className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                    RishteClub Privilege Pass
                  </span>
                  <h3 className="font-serif-luxury text-2xl font-bold text-[#4A121A]">
                    Request Quotation & Discount
                  </h3>
                  <p className="text-xs text-gray-500">
                    Service: <strong>{selectedService}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#4A121A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      WhatsApp / Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientMobile}
                      onChange={(e) => setClientMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#4A121A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Event City / State *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientCity}
                      onChange={(e) => setClientCity(e.target.value)}
                      placeholder="e.g. Delhi NCR / Jaipur"
                      className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#4A121A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Expected Event Date
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#4A121A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Approx. Budget
                    </label>
                    <select
                      value={clientBudget}
                      onChange={(e) => setClientBudget(e.target.value)}
                      className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#4A121A] focus:outline-none"
                    >
                      <option value="Under ₹1,00,000">Under ₹1,00,000</option>
                      <option value="₹1,00,000 - ₹3,00,000">₹1,00,000 - ₹3,00,000</option>
                      <option value="₹3,00,000 - ₹7,00,000">₹3,00,000 - ₹7,00,000</option>
                      <option value="₹7,00,000 - ₹15,00,000">₹7,00,000 - ₹15,00,000</option>
                      <option value="₹15,00,000+ Luxury">₹15,00,000+ Luxury</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4A121A] py-3.5 text-sm font-bold text-white shadow hover:bg-[#380D13] transition"
                >
                  <Gift className="h-4 w-4 text-[#DFBA73]" />
                  <span>Generate ₹5,000 Privilege Voucher</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Vendor Registration Modal */}
      {partnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-[#E2D4BE] p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setPartnerModalOpen(false)}
              className="absolute top-4 right-4 rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 transition"
            >
              <X className="h-4 w-4" />
            </button>

            {vendorSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-serif-luxury text-2xl font-bold text-gray-900">
                  Application Received!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                  Thank you, <strong>{vendorName}</strong>. Our vendor relations manager will contact you on <strong>{vendorPhone}</strong> for early listing verification.
                </p>
              </div>
            ) : (
              <form onSubmit={handleVendorRegister} className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                    Vendor Onboarding
                  </span>
                  <h3 className="font-serif-luxury text-2xl font-bold text-[#4A121A]">
                    List Your Wedding Service
                  </h3>
                  <p className="text-xs text-gray-500">
                    Category: <strong>{selectedService}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Service Category
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#4A121A] focus:outline-none"
                  >
                    {weddingServices.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Business / Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Royal Shahi Decorators"
                    className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#4A121A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      WhatsApp / Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      value={vendorPhone}
                      onChange={(e) => setVendorPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#4A121A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Operating City / State *
                    </label>
                    <input
                      type="text"
                      required
                      value={vendorCity}
                      onChange={(e) => setVendorCity(e.target.value)}
                      placeholder="e.g. Delhi NCR / Jaipur"
                      className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#4A121A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Experience / Portfolio URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={vendorExperience}
                    onChange={(e) => setVendorExperience(e.target.value)}
                    placeholder="e.g. 5+ Years experience or Instagram / Website link"
                    className="w-full rounded-xl border border-[#D9C8B0] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#4A121A] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4A121A] py-3.5 text-sm font-bold text-white shadow hover:bg-[#380D13] transition"
                >
                  <Send className="h-4 w-4 text-[#DFBA73]" />
                  <span>Submit Vendor Application</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
