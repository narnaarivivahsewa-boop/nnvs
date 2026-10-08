import Link from "next/link";
import { Mail, Clock, Heart, ShieldCheck, MessageCircle } from "lucide-react";
import { BUSINESS_INFO } from "@/lib/gst";

export default function Footer() {
  return (
    <footer className="bg-[#300B11] text-white relative overflow-hidden border-t border-[#4A121A]">
      {/* Decorative top accent line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Purpose */}
          <div className="space-y-3">
            <Link href="/" className="inline-block">
              <div className="flex flex-col items-start leading-tight">
                <span className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Rishte<span className="text-[#DFBA73]">Club</span>
                </span>
                <span className="text-[10px] tracking-[0.14em] uppercase font-semibold text-[#DFBA73] font-sans">
                  Managed by NNVS Matrimony
                </span>
              </div>
            </Link>

            <p className="text-xs font-semibold text-[#DFBA73] tracking-wide pt-1">
              &ldquo;{BUSINESS_INFO.tagline}&rdquo;
            </p>

            <p className="text-xs leading-relaxed text-[#D6C4BD]">
              A trusted matrimonial matchmaking platform dedicated to helping families discover suitable life partners with simplicity, transparency, and dignity.
            </p>

            <div className="pt-1 text-xs text-[#E8D8C0] font-medium">
              <span>🙏 जय श्री श्याम 🙏</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 border-b border-[#521822] pb-2 font-serif-luxury">
              Quick Links
            </h3>

            <ul className="space-y-2.5 text-xs text-[#D6C4BD]">
              <li>
                <Link href="/" className="transition hover:text-[#DFBA73]">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/profiles" className="transition hover:text-[#DFBA73]">
                  Browse Profiles
                </Link>
              </li>
              <li>
                <Link href="/astrology" className="transition hover:text-[#DFBA73] font-semibold text-[#DFBA73]">
                  AI Kundli Milan ✨
                </Link>
              </li>
              <li>
                <Link href="/services" className="transition hover:text-[#DFBA73]">
                  Wedding Services & Vendors
                </Link>
              </li>
              <li>
                <Link href="/register" className="transition hover:text-[#DFBA73]">
                  Register Profile
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-[#DFBA73]">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policy */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 border-b border-[#521822] pb-2 font-serif-luxury">
              Help & Policies
            </h3>

            <ul className="space-y-2.5 text-xs text-[#D6C4BD]">
              <li>
                <Link href="/privacy" className="transition hover:text-[#DFBA73]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition hover:text-[#DFBA73]">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="transition hover:text-[#DFBA73]">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/help" className="transition hover:text-[#DFBA73]">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 border-b border-[#521822] pb-2 font-serif-luxury">
              Direct Contact
            </h3>

            <div className="space-y-2.5 text-xs text-[#D6C4BD]">
              <div className="flex items-start gap-2.5">
                <Mail className="h-3.5 w-3.5 text-[#DFBA73] mt-0.5 flex-shrink-0" />
                <a
                  href={`mailto:${BUSINESS_INFO.email}`}
                  className="hover:text-white transition break-all"
                >
                  {BUSINESS_INFO.email}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <MessageCircle className="h-3.5 w-3.5 text-[#25D366] flex-shrink-0" />
                <a
                  href={BUSINESS_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-white hover:text-[#25D366] transition font-bold"
                >
                  +91 {BUSINESS_INFO.primaryWhatsApp}
                </a>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <Clock className="h-3.5 w-3.5 text-[#DFBA73] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Support Note</p>
                  <p className="text-[11px] text-[#A6938D]">WhatsApp Only – Do Not Call</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Matrimonial Searches / SEO Keyword Matrix */}
        <div className="mt-10 pt-8 border-t border-[#521822] space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#DFBA73] font-serif-luxury">
            Popular Matrimonial Searches & Rishtey Categories
          </h4>
          <div className="flex flex-wrap gap-2 text-[11px] text-[#C8B6AF]">
            {[
              { name: "All Marriage Profiles", href: "/profiles" },
              { name: "Agarwal Matrimony", href: "/profiles?caste=Agarwal" },
              { name: "Baniya Rishtey", href: "/profiles?caste=Baniya" },
              { name: "Brahmin Vivah", href: "/profiles?caste=Brahmin" },
              { name: "Punjabi Matrimony", href: "/profiles?caste=Punjabi" },
              { name: "Khatri Shaadi Profiles", href: "/profiles?caste=Khatri" },
              { name: "Arora Rishtey", href: "/profiles?caste=Arora" },
              { name: "Gupta Matrimony", href: "/profiles?caste=Gupta" },
              { name: "Jain Vivah", href: "/profiles?caste=Jain" },
              { name: "Maheshwari Matrimony", href: "/profiles?caste=Maheshwari" },
              { name: "Free Kundli Milan", href: "/astrology" },
              { name: "Lal Kitab Remedies", href: "/astrology" },
              { name: "Wedding Vendors & Services", href: "/services" },
              { name: "Delhi NCR Marriage Bureau", href: "/profiles" },
              { name: "Haryana & Punjab Vivah Sewa", href: "/profiles" },
              { name: "Verified NRI Rishtey", href: "/profiles" },
              { name: "Register Shaadi Biodata", href: "/register" },
            ].map((tag) => (
              <Link
                key={tag.name}
                href={tag.href}
                className="bg-[#24060B] hover:bg-[#4A121A] hover:text-[#DFBA73] px-2.5 py-1 rounded-lg border border-[#521822] transition"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Business & Legal Entity Details */}
        <div className="mt-8 rounded-2xl bg-[#24060B] p-4 sm:p-5 border border-[#4A121A] text-xs text-[#C8B6AF] space-y-2">
          <div className="flex items-center gap-2 text-[#DFBA73] font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>Official Business & Regulatory Information</span>
          </div>
          <p className="leading-relaxed">
            <strong className="text-white">RishteClub</strong> (https://rishteclub.com) is a matrimonial matchmaking platform owned and operated by registered trade entity <strong className="text-white">{BUSINESS_INFO.tradeName}</strong> (Unit: <strong className="text-white">NNVS MATRIMONY</strong> | Proprietor: <strong className="text-white">{BUSINESS_INFO.proprietor}</strong>), and managed by <strong className="text-white">{BUSINESS_INFO.managedByFull}</strong>.
          </p>
          <div className="grid sm:grid-cols-2 gap-2 pt-1 text-[11px] text-[#A6938D]">
            <p>
              <strong className="text-white">GSTIN:</strong> <span className="font-mono text-[#DFBA73]">{BUSINESS_INFO.gstin}</span> (Haryana)
            </p>
            <p>
              <strong className="text-white">MSME Udyam Reg.:</strong> <span className="font-mono text-[#DFBA73]">{BUSINESS_INFO.udyamRegistrationNumber}</span>
            </p>
            <p className="sm:col-span-2">
              <strong className="text-white">Registered Place of Business:</strong> {BUSINESS_INFO.address.fullFormatted}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-[#521822] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A6938D]">
          <p>© {new Date().getFullYear()} RishteClub (Managed by NNVS Matrimony • Trendy Traders). All Rights Reserved.</p>
          <p className="flex items-center gap-1.5 text-[#A6938D]">
            <span>Dedicated to bringing families together</span>
            <Heart className="h-3 w-3 text-[#DFBA73] fill-[#DFBA73] inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}