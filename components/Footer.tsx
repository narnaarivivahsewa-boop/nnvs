import Link from "next/link";
import { Mail, Phone, Clock, Heart } from "lucide-react";

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
              <div className="flex flex-col items-start leading-none">
                <span className="font-serif-luxury text-2xl font-extrabold italic text-white tracking-tight">
                  <span className="text-[#DFBA73] text-3xl inline-block -mr-0.5">N</span>NVS
                </span>
                <span className="text-[10px] tracking-[0.25em] uppercase font-serif-luxury text-[#DFBA73] -mt-1 font-semibold pl-0.5">
                  Matrimony
                </span>
              </div>
            </Link>

            <p className="text-xs font-semibold text-[#DFBA73] uppercase tracking-widest pt-1">
              समाज के प्रति एक सेवा
            </p>

            <p className="text-xs leading-relaxed text-[#D6C4BD]">
              A trusted, community-focused matrimonial platform dedicated to helping families discover genuine, verified life partners with simplicity and dignity.
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
                <Link href="/register" className="transition hover:text-[#DFBA73]">
                  Register Now
                </Link>
              </li>
              <li>
                <Link href="/#services" className="transition hover:text-[#DFBA73]">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/#stories" className="transition hover:text-[#DFBA73]">
                  How It Works
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
                  href="mailto:narnaarivivahsewa@gmail.com"
                  className="hover:text-white transition break-all"
                >
                  narnaarivivahsewa@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 text-[#DFBA73] flex-shrink-0" />
                <div className="space-y-0.5">
                  <a href="tel:+919871592002" className="block hover:text-white transition">
                    +91 9871592002
                  </a>
                  <a href="tel:+917015812359" className="block hover:text-white transition">
                    +91 7015812359
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <Clock className="h-3.5 w-3.5 text-[#DFBA73] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Calling Hours</p>
                  <p className="text-[11px] text-[#A6938D]">5:30 PM – 7:30 PM IST</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-[#521822] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A6938D]">
          <p>© {new Date().getFullYear()} NNVS MATRIMONY. All Rights Reserved.</p>
          <p className="flex items-center gap-1.5 text-[#A6938D]">
            <span>Built with devotion</span>
            <Heart className="h-3 w-3 text-[#DFBA73] fill-[#DFBA73] inline" />
            <span>for community welfare</span>
          </p>
        </div>
      </div>
    </footer>
  );
}