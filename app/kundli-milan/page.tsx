"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  User,
  Star,
  RefreshCw,
  Check,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  PhoneCall,
  MessageCircle,
} from "lucide-react";
import type { KundliMilanResult, AshtakootScore } from "@/lib/ashtakoot";

/**
 * 200+ Alphabetically Sorted Cities covering all 22 Haryana districts,
 * Punjab, Rajasthan, Delhi-NCR, Western UP, and major Indian metro hubs.
 */
export const INDIAN_CITIES: readonly string[] = [
  "Abohar, Punjab",
  "Agra, Uttar Pradesh",
  "Ahmedabad, Gujarat",
  "Ahmednagar, Maharashtra",
  "Ajmer, Rajasthan",
  "Aligarh, Uttar Pradesh",
  "Alwar, Rajasthan",
  "Ambala, Haryana",
  "Ambala Cantt, Haryana",
  "Amravati, Maharashtra",
  "Amritsar, Punjab",
  "Anand, Gujarat",
  "Asansol, West Bengal",
  "Assandh, Haryana",
  "Aurangabad, Maharashtra",
  "Ayodhya, Uttar Pradesh",
  "Badaun, Uttar Pradesh",
  "Baghpat, Uttar Pradesh",
  "Bahadurgarh, Haryana",
  "Balotra, Rajasthan",
  "Banswara, Rajasthan",
  "Baran, Rajasthan",
  "Bareilly, Uttar Pradesh",
  "Barmer, Rajasthan",
  "Barnala, Punjab",
  "Barwala, Haryana",
  "Bathinda, Punjab",
  "Beawar, Rajasthan",
  "Bengaluru, Karnataka",
  "Bharatpur, Rajasthan",
  "Bhavnagar, Gujarat",
  "Bhilwara, Rajasthan",
  "Bhiwani, Haryana",
  "Bhopal, Madhya Pradesh",
  "Bhubaneswar, Odisha",
  "Bikaner, Rajasthan",
  "Bilaspur, Chhattisgarh",
  "Bokaro Steel City, Jharkhand",
  "Bulandshahr, Uttar Pradesh",
  "Bundi, Rajasthan",
  "Chandausi, Uttar Pradesh",
  "Chandigarh, Union Territory",
  "Charkhi Dadri, Haryana",
  "Chennai, Tamil Nadu",
  "Chittorgarh, Rajasthan",
  "Churu, Rajasthan",
  "Coimbatore, Tamil Nadu",
  "Cuttack, Odisha",
  "Dabwali, Haryana",
  "Dausa, Rajasthan",
  "Dehradun, Uttarakhand",
  "Delhi, Delhi",
  "Deoband, Uttar Pradesh",
  "Dhanbad, Jharkhand",
  "Dholpur, Rajasthan",
  "Didwana, Rajasthan",
  "Durgapur, West Bengal",
  "Ellenabad, Haryana",
  "Etawah, Uttar Pradesh",
  "Faizabad, Uttar Pradesh",
  "Faridabad, Haryana",
  "Fatehabad, Haryana",
  "Fatehpur, Uttar Pradesh",
  "Fazilka, Punjab",
  "Firozabad, Uttar Pradesh",
  "Firozpur, Punjab",
  "Gandhinagar, Gujarat",
  "Gaya, Bihar",
  "Ghaziabad, Uttar Pradesh",
  "Gohana, Haryana",
  "Gorakhpur, Uttar Pradesh",
  "Greater Noida, Uttar Pradesh",
  "Gurdaspur, Punjab",
  "Gurugram, Haryana",
  "Gwalior, Madhya Pradesh",
  "Haldwani, Uttarakhand",
  "Hanumangarh, Rajasthan",
  "Hapur, Uttar Pradesh",
  "Haridwar, Uttarakhand",
  "Hathras, Uttar Pradesh",
  "Hisar, Haryana",
  "Hodal, Haryana",
  "Hoshiarpur, Punjab",
  "Hyderabad, Telangana",
  "Indore, Madhya Pradesh",
  "Jabalpur, Madhya Pradesh",
  "Jagadhri, Haryana",
  "Jagraon, Punjab",
  "Jaipur, Rajasthan",
  "Jaisalmer, Rajasthan",
  "Jalandhar, Punjab",
  "Jalore, Rajasthan",
  "Jammu, Jammu & Kashmir",
  "Jamnagar, Gujarat",
  "Jamshedpur, Jharkhand",
  "Jhajjar, Haryana",
  "Jhalawar, Rajasthan",
  "Jhansi, Uttar Pradesh",
  "Jhunjhunu, Rajasthan",
  "Jind, Haryana",
  "Jodhpur, Rajasthan",
  "Kaithal, Haryana",
  "Kalanwali, Haryana",
  "Kanpur, Uttar Pradesh",
  "Kapurthala, Punjab",
  "Karnal, Haryana",
  "Kasganj, Uttar Pradesh",
  "Khanna, Punjab",
  "Khurja, Uttar Pradesh",
  "Kishangarh, Rajasthan",
  "Kochi, Kerala",
  "Kolhapur, Maharashtra",
  "Kolkata, West Bengal",
  "Kota, Rajasthan",
  "Kotkapura, Punjab",
  "Kotputli, Rajasthan",
  "Kozhikode, Kerala",
  "Kurukshetra, Haryana",
  "Ladwa, Haryana",
  "Loni, Uttar Pradesh",
  "Lucknow, Uttar Pradesh",
  "Ludhiana, Punjab",
  "Madurai, Tamil Nadu",
  "Mahendragarh, Haryana",
  "Mainpuri, Uttar Pradesh",
  "Malerkotla, Punjab",
  "Mandi Dabwali, Haryana",
  "Mandi Gobindgarh, Punjab",
  "Manesar, Haryana",
  "Mangaluru, Karnataka",
  "Mansa, Punjab",
  "Mathura, Uttar Pradesh",
  "Meerut, Uttar Pradesh",
  "Modinagar, Uttar Pradesh",
  "Moga, Punjab",
  "Mohali (SAS Nagar), Punjab",
  "Moradabad, Uttar Pradesh",
  "Muktsar, Punjab",
  "Mumbai, Maharashtra",
  "Muzaffarnagar, Uttar Pradesh",
  "Mysuru, Karnataka",
  "Nagaur, Rajasthan",
  "Nagpur, Maharashtra",
  "Narnaul, Haryana",
  "Narwana, Haryana",
  "Nashik, Maharashtra",
  "Navi Mumbai, Maharashtra",
  "Nawanshahr, Punjab",
  "Neem Ka Thana, Rajasthan",
  "New Delhi, Delhi",
  "Noida, Uttar Pradesh",
  "Nuh, Haryana",
  "Pali, Rajasthan",
  "Palwal, Haryana",
  "Panchkula, Haryana",
  "Panipat, Haryana",
  "Pathankot, Punjab",
  "Patiala, Punjab",
  "Patna, Bihar",
  "Pehowa, Haryana",
  "Phagwara, Punjab",
  "Phalodi, Rajasthan",
  "Pilani, Rajasthan",
  "Pilibhit, Uttar Pradesh",
  "Prayagraj (Allahabad), Uttar Pradesh",
  "Pundri, Haryana",
  "Pune, Maharashtra",
  "Raipur, Chhattisgarh",
  "Rajkot, Gujarat",
  "Rajpura, Punjab",
  "Rajsamand, Rajasthan",
  "Rampur, Uttar Pradesh",
  "Ranchi, Jharkhand",
  "Ratia, Haryana",
  "Rawatsar, Rajasthan",
  "Rewari, Haryana",
  "Rishikesh, Uttarakhand",
  "Rohtak, Haryana",
  "Roorkee, Uttarakhand",
  "Ropar (Roopnagar), Punjab",
  "Rourkela, Odisha",
  "Safidon, Haryana",
  "Saharanpur, Uttar Pradesh",
  "Samalkha, Haryana",
  "Samana, Punjab",
  "Sambhal, Uttar Pradesh",
  "Sangrur, Punjab",
  "Shahbad, Haryana",
  "Shahjahanpur, Uttar Pradesh",
  "Shamli, Uttar Pradesh",
  "Shikohabad, Uttar Pradesh",
  "Shimla, Himachal Pradesh",
  "Sikar, Rajasthan",
  "Siliguri, West Bengal",
  "Sirsa, Haryana",
  "Sitapur, Uttar Pradesh",
  "Sohna, Haryana",
  "Solapur, Maharashtra",
  "Sonipat, Haryana",
  "Sri Ganganagar, Rajasthan",
  "Srinagar, Jammu & Kashmir",
  "Sunam, Punjab",
  "Surat, Gujarat",
  "Suratgarh, Rajasthan",
  "Taraori, Haryana",
  "Tarn Taran, Punjab",
  "Thane, Maharashtra",
  "Thanesar, Haryana",
  "Thiruvananthapuram, Kerala",
  "Tohana, Haryana",
  "Tonk, Rajasthan",
  "Uchana, Haryana",
  "Udaipur, Rajasthan",
  "Ujjain, Madhya Pradesh",
  "Uklana, Haryana",
  "Vadodara, Gujarat",
  "Varanasi, Uttar Pradesh",
  "Vijayawada, Andhra Pradesh",
  "Visakhapatnam, Andhra Pradesh",
  "Vrindavan, Uttar Pradesh",
  "Yamunanagar, Haryana",
  "Zirakpur, Punjab",
] as const;

const HOURS_LIST = [
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11", "12"
];

const MINUTES_LIST = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0")
);

function convertTo24Hour(hourStr: string, minStr: string, ampm: "AM" | "PM"): string {
  let h = Number.parseInt(hourStr || "12", 10);
  const m = minStr.padStart(2, "0");
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${m}`;
}

export default function KundliMilanPage() {
  // Groom (Boy) State
  const [boyName, setBoyName] = useState("");
  const [boyDob, setBoyDob] = useState("");
  const [boyHour, setBoyHour] = useState("12");
  const [boyMinute, setBoyMinute] = useState("00");
  const [boyAmPm, setBoyAmPm] = useState<"AM" | "PM">("PM");
  const [boyPlace, setBoyPlace] = useState("");

  // Bride (Girl) State
  const [girlName, setGirlName] = useState("");
  const [girlDob, setGirlDob] = useState("");
  const [girlHour, setGirlHour] = useState("12");
  const [girlMinute, setGirlMinute] = useState("00");
  const [girlAmPm, setGirlAmPm] = useState<"AM" | "PM">("PM");
  const [girlPlace, setGirlPlace] = useState("");

  // OTP Verification State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Results & Lead State
  const [formError, setFormError] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [milanResult, setMilanResult] = useState<KundliMilanResult | null>(null);

  // Delayed Pricing Popup State (3-4 seconds delay)
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Expandable Ashtakoot Accordions State (default all 8 open for rich engagement)
  const [expandedKoots, setExpandedKoots] = useState<Record<string, boolean>>({
    Nadi: true,
    Bhakoot: true,
    Gana: true,
    "Graha Maitri": true,
    Yoni: true,
    Tara: true,
    Vashya: true,
    Varna: true,
  });

  const toggleKoot = (name: string) => {
    setExpandedKoots((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const toggleAllKoots = (expand: boolean) => {
    setExpandedKoots({
      Nadi: expand,
      Bhakoot: expand,
      Gana: expand,
      "Graha Maitri": expand,
      Yoni: expand,
      Tara: expand,
      Vashya: expand,
      Varna: expand,
    });
  };

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Delayed Registration Popup Trigger (3.5 seconds)
  useEffect(() => {
    if (milanResult && verifiedPhone) {
      const popupTimer = setTimeout(() => {
        setShowPricingPopup(true);
      }, 3500);

      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: "smooth" });
      }

      return () => clearTimeout(popupTimer);
    }
  }, [milanResult, verifiedPhone]);

  // Handle Form Submission -> Open OTP Modal
  function handleInitiateMilan(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!boyName.trim() || !boyDob || !boyPlace.trim()) {
      setFormError("Please fill in all details for Groom (Boy) including Date of Birth and Birth City.");
      return;
    }

    if (!girlName.trim() || !girlDob || !girlPlace.trim()) {
      setFormError("Please fill in all details for Bride (Girl) including Date of Birth and Birth City.");
      return;
    }

    setIsOtpModalOpen(true);
    setOtpError("");
  }

  // Send OTP Handler
  async function handleSendOtp() {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setOtpError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSendingOtp(true);
    setOtpError("");

    try {
      const res = await fetch("/api/kundli/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: cleanPhone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpError(data.error || data.message || "Failed to send OTP. Please try again.");
        return;
      }

      setOtpSent(true);
      setResendCooldown(60);
    } catch {
      setOtpError("Network error while connecting to SMS gateway. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  // Verify OTP & Calculate Result Handler
  async function handleVerifyOtp() {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setOtpError("Please enter the complete OTP received on your mobile.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError("");

    const boyTime24 = convertTo24Hour(boyHour, boyMinute, boyAmPm);
    const girlTime24 = convertTo24Hour(girlHour, girlMinute, girlAmPm);

    try {
      const payload = {
        phoneNumber: cleanPhone,
        otp: cleanOtp,
        boyName: boyName.trim(),
        boyDob,
        boyTime: boyTime24,
        boyPlace: boyPlace.trim(),
        girlName: girlName.trim(),
        girlDob,
        girlTime: girlTime24,
        girlPlace: girlPlace.trim(),
      };

      const res = await fetch("/api/kundli/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setOtpError(data.error || data.message || "Invalid OTP. Please verify and retry.");
        return;
      }

      setVerifiedPhone(data.verifiedPhone);
      setMilanResult(data.result);
      setIsOtpModalOpen(false);
    } catch {
      setOtpError("Network error during verification. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2A1A1F]">
      {/* Print Stylesheet for Authentic Vedic Kundali Milan Certificate */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          nav, header, footer, .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 10.5pt !important;
          }
          .print-only {
            display: block !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 8mm !important;
            background: #ffffff !important;
            border: 2px solid #4A121A !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `,
        }}
      />

      {/* 150+ Sorted City Autocomplete Datalist */}
      <datalist id="indian-cities-datalist">
        {INDIAN_CITIES.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>

      {/* Hero Header */}
      <section className="no-print bg-gradient-to-b from-[#4A121A] via-[#5C1621] to-[#4A121A] text-white py-12 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-[#C5A059]/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="w-full max-w-lg md:max-w-4xl mx-auto text-center relative z-10 px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#DFBA73] text-xs font-semibold tracking-wider uppercase mb-4">
            <Sparkles className="w-4 h-4 text-[#DFBA73]" />
            100% Free & Accurate Vedic Matchmaking
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-serif text-[#FFFDF9]">
            Free Kundali Milan <span className="text-[#DFBA73]">(फ्री कुंडली मिलान)</span>
          </h1>
          <p className="mt-3.5 text-sm sm:text-base md:text-lg text-rose-100 max-w-2xl mx-auto">
            Traditional 36-Guna Ashtakoot matching and Manglik Dosha analysis for prospective brides and grooms according to Vedic astrology.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-rose-200">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#DFBA73]" /> 36 Guna Ashtakoot Score
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#DFBA73]" /> Manglik Dosha Verification
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#DFBA73]" /> Nadi & Bhakoot Check
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#DFBA73]" /> Instant SMS Verification
            </span>
          </div>
        </div>
      </section>

      {/* Main Form Container */}
      <main className="w-full max-w-lg md:max-w-4xl mx-auto px-4 py-8 sm:py-10">
        <form onSubmit={handleInitiateMilan} className="no-print space-y-8">
          {formError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Boy's Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8DFD3] p-5 sm:p-7 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#F0E8DC]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#4A121A]">Groom Details</h2>
                    <p className="text-xs text-[#7A5835]">लड़के का विवरण</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                  Boy
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter groom's full name"
                    value={boyName}
                    onChange={(e) => setBoyName(e.target.value)}
                    className="w-full h-12 px-4 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={boyDob}
                    onChange={(e) => setBoyDob(e.target.value)}
                    className="w-full h-12 px-4 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                  />
                </div>

                {/* 12-Hour Time Picker with AM/PM */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                    Time of Birth (12-Hour)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={boyHour}
                      onChange={(e) => setBoyHour(e.target.value)}
                      className="w-full h-12 px-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                    >
                      {HOURS_LIST.map((h) => (
                        <option key={h} value={h}>
                          {h} Hr
                        </option>
                      ))}
                    </select>

                    <select
                      value={boyMinute}
                      onChange={(e) => setBoyMinute(e.target.value)}
                      className="w-full h-12 px-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                    >
                      {MINUTES_LIST.map((m) => (
                        <option key={m} value={m}>
                          {m} Min
                        </option>
                      ))}
                    </select>

                    <select
                      value={boyAmPm}
                      onChange={(e) => setBoyAmPm(e.target.value as "AM" | "PM")}
                      className="w-full h-12 px-3 text-sm font-semibold rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9] text-[#4A121A]"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                {/* Birth Place: Searchable City Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                    Birth City / Place <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="indian-cities-datalist"
                    placeholder="उदा. Fatehabad, Hisar, Delhi"
                    value={boyPlace}
                    onChange={(e) => setBoyPlace(e.target.value)}
                    className="w-full h-12 px-4 py-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                  />
                </div>
              </div>
            </div>

            {/* Girl's Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8DFD3] p-5 sm:p-7 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#F0E8DC]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center font-bold">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#4A121A]">Bride Details</h2>
                    <p className="text-xs text-[#7A5835]">लड़की का विवरण</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-pink-50 text-pink-800 font-semibold border border-pink-200">
                  Girl
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter bride's full name"
                    value={girlName}
                    onChange={(e) => setGirlName(e.target.value)}
                    className="w-full h-12 px-4 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={girlDob}
                    onChange={(e) => setGirlDob(e.target.value)}
                    className="w-full h-12 px-4 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                  />
                </div>

                {/* 12-Hour Time Picker with AM/PM */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                    Time of Birth (12-Hour)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={girlHour}
                      onChange={(e) => setGirlHour(e.target.value)}
                      className="w-full h-12 px-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                    >
                      {HOURS_LIST.map((h) => (
                        <option key={h} value={h}>
                          {h} Hr
                        </option>
                      ))}
                    </select>

                    <select
                      value={girlMinute}
                      onChange={(e) => setGirlMinute(e.target.value)}
                      className="w-full h-12 px-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                    >
                      {MINUTES_LIST.map((m) => (
                        <option key={m} value={m}>
                          {m} Min
                        </option>
                      ))}
                    </select>

                    <select
                      value={girlAmPm}
                      onChange={(e) => setGirlAmPm(e.target.value as "AM" | "PM")}
                      className="w-full h-12 px-3 text-sm font-semibold rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9] text-[#4A121A]"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                {/* Birth Place: Searchable City Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A3E39] mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                    Birth City / Place <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="indian-cities-datalist"
                    placeholder="उदा. Fatehabad, Hisar, Delhi"
                    value={girlPlace}
                    onChange={(e) => setGirlPlace(e.target.value)}
                    className="w-full h-12 px-4 py-3 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto h-12 min-h-[48px] inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl text-base font-bold bg-[#4A121A] text-white hover:bg-[#601722] active:scale-[0.99] transition-all shadow-md shadow-[#4A121A]/20 border border-[#C5A059]"
            >
              <Sparkles className="w-5 h-5 text-[#DFBA73]" />
              Match Kundli Free (गुण मिलान करें)
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
            <p className="mt-2.5 text-xs text-[#7A5835]">
              Quick 1-step phone verification required to view the full 36 Guna Ashtakoot report.
            </p>
          </div>
        </form>

        {/* Results Section */}
        {milanResult && (
          <div ref={resultsRef} className="mt-14 space-y-10 scroll-mt-6">
            {/* Top Action Bar with PDF Download Button & Astrological Helpline */}
            <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white border-2 border-[#C5A059]/40 shadow-sm">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-xl bg-[#4A121A] text-[#DFBA73] flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                  <FileText className="w-6 h-6 text-[#DFBA73]" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#4A121A] font-serif">
                    Vedic Kundali Milan Report Ready
                  </h4>
                  <p className="text-xs text-[#7A5835]">
                    36 Guna Ashtakoot Score &amp; Complete Remedial Assessment
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-12 min-h-[48px] w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#4A121A] via-[#601722] to-[#4A121A] text-[#FFFDF9] hover:from-[#3A0C13] hover:to-[#50131E] border border-[#C5A059] shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#DFBA73]" />
                  <span>Download Complete Kundali Milan Report (PDF)</span>
                </button>
                <a
                  href="tel:+919871592002"
                  className="h-12 min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs border border-[#C5A059] bg-[#FAF5EB] text-[#4A121A] hover:bg-[#F2E8D7] transition shadow-xs"
                  title="Astrological Consultation Helpline"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>+91-9871592002</span>
                </a>
              </div>
            </div>

            {/* Overall Score Banner */}
            <div className="no-print rounded-2xl bg-gradient-to-br from-white via-[#FFFDF9] to-[#FDF7EC] border-2 border-[#C5A059]/40 shadow-lg p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#E8DFD3]">
                <div className="text-center md:text-left space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#4A121A]/10 text-[#4A121A]">
                    <Star className="w-3.5 h-3.5 text-[#C5A059] fill-[#C5A059]" />
                    Astrological Kundli Milan Report
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A121A] font-serif">
                    {milanResult.verdict}
                  </h2>
                  <p className="text-base font-medium text-[#7A5835]">
                    {milanResult.verdictHindi} – {milanResult.verdictDescription}
                  </p>
                </div>

                {/* Score Circular Callout */}
                <div className="flex-shrink-0 text-center px-6 py-4 rounded-2xl bg-[#4A121A] text-white shadow-md border border-[#C5A059]">
                  <span className="block text-xs uppercase tracking-wider text-[#DFBA73] font-semibold">
                    Total Guna Score
                  </span>
                  <div className="text-4xl sm:text-5xl font-extrabold text-[#FFFDF9] my-1">
                    {milanResult.totalScore} <span className="text-xl text-[#DFBA73]">/ {milanResult.maxScore}</span>
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A059] text-[#4A121A]">
                    {milanResult.percentage}% Compatibility
                  </span>
                </div>
              </div>

              {/* Boy & Girl Planetary Snapshot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block mb-1">
                    Groom (वर): {milanResult.boyInfo.name}
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs text-[#4A3E39]">
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      Rasi: <strong>{milanResult.boyInfo.rasi}</strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      Nakshatra: <strong>{milanResult.boyInfo.nakshatra} (Pada {milanResult.boyInfo.charan})</strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      Lord: <strong>{milanResult.boyInfo.nakshatraLord}</strong>
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-pink-50/50 border border-pink-200/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-900 block mb-1">
                    Bride (कन्या): {milanResult.girlInfo.name}
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs text-[#4A3E39]">
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      Rasi: <strong>{milanResult.girlInfo.rasi}</strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      Nakshatra: <strong>{milanResult.girlInfo.nakshatra} (Pada {milanResult.girlInfo.charan})</strong>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      Lord: <strong>{milanResult.girlInfo.nakshatraLord}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Manglik Dosha Summary Banner */}
              <div
                className={`mt-5 p-4 rounded-xl border flex items-start gap-3 ${
                  milanResult.manglikAnalysis.status === "NO_MANGLIK" ||
                  milanResult.manglikAnalysis.isCanceled
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <ShieldCheck
                  className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                    milanResult.manglikAnalysis.status === "NO_MANGLIK" ||
                    milanResult.manglikAnalysis.isCanceled
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                />
                <div className="text-sm">
                  <strong className="block font-bold">
                    Manglik Dosha Analysis:{" "}
                    {milanResult.manglikAnalysis.status === "NO_MANGLIK"
                      ? "Non-Manglik"
                      : milanResult.manglikAnalysis.isCanceled
                      ? "Manglik Dosha Cancelled (Anukul)"
                      : "Manglik Consideration"}
                  </strong>
                  <p className="mt-0.5 opacity-90">{milanResult.manglikAnalysis.details}</p>
                </div>
              </div>
            </div>

            {/* Comprehensive Relationship & Life Forecast Card */}
            {milanResult.forecast && (
              <div className="no-print rounded-2xl bg-white border border-[#C5A059]/50 shadow-md p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#F0E8DC]">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#4A121A] text-[#DFBA73] mb-1.5">
                      Compatibility Level: {milanResult.forecast.level} ({milanResult.forecast.titleHindi})
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#4A121A] font-serif">
                      {milanResult.forecast.title}
                    </h3>
                  </div>
                  <span
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                      milanResult.forecast.level === "Uttam"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : milanResult.forecast.level === "Madhyam"
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : milanResult.forecast.level === "Samanya"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                    }`}
                  >
                    श्रेणी: {milanResult.forecast.level}
                  </span>
                </div>

                {/* 4-Quadrant Life Compatibility Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quadrant 1: Health & Longevity */}
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3]">
                    <div className="flex items-center gap-2 mb-2 text-[#4A121A] font-bold text-sm">
                      <Heart className="w-4 h-4 text-rose-600" />
                      <span>आयु, स्वास्थ्य व जीवन सुरक्षा (Health &amp; Longevity)</span>
                    </div>
                    <p className="text-xs text-[#4A3E39] leading-relaxed">
                      {milanResult.forecast.lifeExpectancyOutlook}
                    </p>
                  </div>

                  {/* Quadrant 2: Mutual Understanding */}
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3]">
                    <div className="flex items-center gap-2 mb-2 text-[#4A121A] font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      <span>वैचारिक सामंजस्य व समझदारी (Mutual Understanding)</span>
                    </div>
                    <p className="text-xs text-[#4A3E39] leading-relaxed">
                      {milanResult.forecast.mutualUnderstandingForecast}
                    </p>
                  </div>

                  {/* Quadrant 3: Financial & Career Growth */}
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3]">
                    <div className="flex items-center gap-2 mb-2 text-[#4A121A] font-bold text-sm">
                      <Star className="w-4 h-4 text-amber-600" />
                      <span>आर्थिक समृद्धि व करियर सहयोग (Financial Prospects)</span>
                    </div>
                    <p className="text-xs text-[#4A3E39] leading-relaxed">
                      {milanResult.forecast.financialProspects}
                    </p>
                  </div>

                  {/* Quadrant 4: Offspring & Family */}
                  <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3]">
                    <div className="flex items-center gap-2 mb-2 text-[#4A121A] font-bold text-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>संतान सुख व कुल वृद्धि (Progeny &amp; Family Harmony)</span>
                    </div>
                    <p className="text-xs text-[#4A3E39] leading-relaxed">
                      {milanResult.forecast.offspringFamilyOutlook}
                    </p>
                  </div>
                </div>

                {/* Master Vedic Astrological Guidance */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#FAF5EB] to-[#FFFDF9] border border-[#C5A059]/40 text-xs text-[#4A3E39]">
                  <strong className="block font-bold text-[#4A121A] text-sm mb-1">
                    🕉️ वैदिक ज्योतिषाचार्य परामर्श (Vedic Astrological Guidance):
                  </strong>
                  <p className="leading-relaxed">{milanResult.forecast.overallAdvice}</p>
                </div>
              </div>
            )}

            {/* Comprehensive 8-Koot Detailed Interpretation Section */}
            <div className="no-print space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#4A121A] font-serif">
                    Comprehensive 8-Koot Detailed Interpretation (अष्टकूट विस्तृत विश्लेषण)
                  </h3>
                  <p className="text-xs text-[#7A5835] mt-0.5">
                    Click each Koot to explore benefits, friction risks, and specific Vedic remedies
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAllKoots(true)}
                    className="text-xs font-semibold text-[#4A121A] hover:underline px-2.5 py-1 rounded bg-[#FAF5EB] border border-[#DACBB4]"
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAllKoots(false)}
                    className="text-xs font-semibold text-[#7A5835] hover:underline px-2.5 py-1 rounded bg-[#FAF5EB] border border-[#DACBB4]"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* 8 Koot Accordion Cards */}
              <div className="space-y-4">
                {milanResult.scores.map((koot: AshtakootScore, idx: number) => {
                  const isOpen = Boolean(expandedKoots[koot.name]);
                  const isPerfect = koot.obtained === koot.total;
                  const isPartial = koot.obtained > 0 && koot.obtained < koot.total;

                  return (
                    <div
                      key={koot.name}
                      className="bg-white rounded-2xl border border-[#E8DFD3] shadow-sm hover:border-[#C5A059] transition-all overflow-hidden"
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleKoot(koot.name)}
                        className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left bg-gradient-to-r from-white to-[#FAF7F2] hover:bg-[#FDF7EC] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#4A121A]/10 text-[#4A121A] font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-[#4A121A]">
                                {koot.name} Koot ({koot.nameHindi})
                              </h4>
                              <span className="text-xs text-gray-400 font-normal">
                                • Max: {koot.total} Guna
                              </span>
                            </div>
                            <p className="text-xs text-[#7A5835] mt-0.5 line-clamp-1">
                              {koot.significance || koot.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          {/* Attributes Pill */}
                          <div className="text-[11px] bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-[#4A3E39]">
                            <span>वर: <strong>{koot.boyAttribute}</strong></span>
                            <span className="mx-1.5 text-gray-300">|</span>
                            <span>कन्या: <strong>{koot.girlAttribute}</strong></span>
                          </div>

                          {/* Score Badge */}
                          <span
                            className={`text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full ${
                              isPerfect
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : isPartial
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : "bg-red-100 text-red-800 border border-red-300"
                            }`}
                          >
                            {koot.obtained} / {koot.total}
                          </span>

                          <div className="p-1 rounded-md text-gray-400 hover:text-[#4A121A]">
                            {isOpen ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Accordion Expanded Content */}
                      {isOpen && (
                        <div className="p-4 sm:p-6 border-t border-[#F0E8DC] bg-white space-y-4">
                          {/* Core Significance Banner */}
                          <div className="p-3 rounded-xl bg-[#FAF5EB] border border-[#DACBB4]/60 text-xs text-[#4A3E39] flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-[#4A121A]">कूट का महत्व एवं प्रभाव: </strong>
                              <span>{koot.significance}</span>
                            </div>
                          </div>

                          {/* Fayde vs Nuksan Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Fayde (Positive Aspects) */}
                            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                              <div className="flex items-center gap-2 mb-1.5 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>फायदे (अगर गुण मिला):</span>
                              </div>
                              <p className="text-xs text-emerald-950 leading-relaxed">
                                {koot.benefits}
                              </p>
                            </div>

                            {/* Nuksan & Prabhav (Friction Risks) */}
                            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80">
                              <div className="flex items-center gap-2 mb-1.5 text-rose-900 font-bold text-xs uppercase tracking-wider">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>नुकसान व संभावित प्रभाव (अगर गुण कम/शून्य हैं):</span>
                              </div>
                              <p className="text-xs text-rose-950 leading-relaxed">
                                {koot.risksIfZero}
                              </p>
                            </div>
                          </div>

                          {/* Vedic Upay & Nivaran Box */}
                          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-xs text-[#4A3E39]">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs sm:text-sm">
                                <Sparkles className="w-4 h-4 text-amber-600" />
                                <span>वैदिक उपाय एवं निवारण (Vedic Remedies &amp; Guidance):</span>
                              </div>
                              <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                                Authentic Vedic
                              </span>
                            </div>
                            <p className="leading-relaxed text-amber-950">
                              {koot.remedy}
                            </p>
                            <p className="mt-2 pt-2 border-t border-amber-200 text-[11px] text-[#7A5835]">
                              💡 विशेष दोष निवारण संकल्प, महामृत्युंजय अनुष्ठान या ₹117 टोकन मार्गदर्शन हेतु NNVS सहायता केंद्र पर सीधे संपर्क करें: <strong>+91-9871592002</strong>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom PDF Download & Register Actions Bar */}
            <div className="no-print rounded-2xl bg-gradient-to-r from-[#4A121A] via-[#5C1621] to-[#4A121A] text-white p-6 sm:p-8 border-2 border-[#C5A059] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="inline-block text-xs uppercase tracking-wider text-[#DFBA73] font-bold">
                  Complete Vedic Matrimonial Dossier
                </span>
                <h3 className="text-2xl font-extrabold font-serif text-[#FFFDF9]">
                  Download Official Kundali Match Certificate
                </h3>
                <p className="text-sm text-rose-100 max-w-xl">
                  Save your verified 36 Guna Ashtakoot calculation, Manglik dosha analysis, and Astrological remedies as an official PDF report.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto h-12 min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#DFBA73] text-[#4A121A] hover:bg-[#E6C280] active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#4A121A]" />
                  <span>Download Report (PDF)</span>
                </button>

                <Link
                  href={`/register?phone=${verifiedPhone}`}
                  className="w-full sm:w-auto h-12 min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-[#DFBA73] text-[#FFFDF9] hover:bg-[#601722] active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#DFBA73]" />
                  <span>Register Profile</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* PRINTABLE VEDIC KUNDALI MATCHMAKING CERTIFICATE (PRINT-ONLY)            */}
            {/* ========================================================================= */}
            <div className="print-only print-container text-black bg-white">
              {/* Sacred Invocation Header */}
              <div className="text-center pb-3 border-b-2 border-[#4A121A] mb-4">
                <p className="text-xs font-bold tracking-widest text-[#4A121A]">
                  ॥ ॐ श्री गणेशाय नमः ॥ &nbsp;•&nbsp; ॥ शुभ विवाह ॥ &nbsp;•&nbsp; ॥ जय श्री श्याम ॥
                </p>
                <h1 className="text-xl font-black uppercase tracking-wider text-[#4A121A] mt-1">
                  RishteClub Vedic Matrimonial Matchmaking Certificate
                </h1>
                <p className="text-[11px] text-gray-600 font-medium">
                  Managed by NNVS Matrimony (Official Registration Certificate) • rishteclub.com
                </p>
                <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 mt-1 border-t border-gray-200">
                  <span>Certificate ID: <strong>RC-KUNDLI-{verifiedPhone.slice(-4)}-{Date.now().toString().slice(-6)}</strong></span>
                  <span>Verified Phone: <strong>+91 {verifiedPhone}</strong></span>
                  <span>Date: <strong>{new Date().toLocaleDateString("en-IN")}</strong></span>
                </div>
              </div>

              {/* Groom & Bride Details Table */}
              <div className="grid grid-cols-2 gap-3 mb-4 print-break-inside-avoid">
                <div className="border border-gray-400 p-2.5 rounded-sm">
                  <h4 className="font-bold text-xs uppercase text-[#4A121A] border-b border-gray-300 pb-1 mb-1">
                    Groom (वर विवरण): {milanResult.boyInfo.name}
                  </h4>
                  <table className="w-full text-[10.5px]">
                    <tbody>
                      <tr>
                        <td className="text-gray-600 py-0.5">Rasi (राशि):</td>
                        <td className="font-bold">{milanResult.boyInfo.rasi}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-600 py-0.5">Nakshatra:</td>
                        <td className="font-bold">{milanResult.boyInfo.nakshatra} (Pada {milanResult.boyInfo.charan})</td>
                      </tr>
                      <tr>
                        <td className="text-gray-600 py-0.5">Nakshatra Lord:</td>
                        <td className="font-bold">{milanResult.boyInfo.nakshatraLord}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-600 py-0.5">Manglik Status:</td>
                        <td className="font-bold">{milanResult.boyInfo.manglik ? "Manglik" : "Non-Manglik"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border border-gray-400 p-2.5 rounded-sm">
                  <h4 className="font-bold text-xs uppercase text-[#4A121A] border-b border-gray-300 pb-1 mb-1">
                    Bride (कन्या विवरण): {milanResult.girlInfo.name}
                  </h4>
                  <table className="w-full text-[10.5px]">
                    <tbody>
                      <tr>
                        <td className="text-gray-600 py-0.5">Rasi (राशि):</td>
                        <td className="font-bold">{milanResult.girlInfo.rasi}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-600 py-0.5">Nakshatra:</td>
                        <td className="font-bold">{milanResult.girlInfo.nakshatra} (Pada {milanResult.girlInfo.charan})</td>
                      </tr>
                      <tr>
                        <td className="text-gray-600 py-0.5">Nakshatra Lord:</td>
                        <td className="font-bold">{milanResult.girlInfo.nakshatraLord}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-600 py-0.5">Manglik Status:</td>
                        <td className="font-bold">{milanResult.girlInfo.manglik ? "Manglik" : "Non-Manglik"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Score Summary Box */}
              <div className="border-2 border-[#4A121A] p-2.5 bg-gray-50 rounded-sm mb-4 flex items-center justify-between print-break-inside-avoid">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-600 block">
                    Final Matchmaking Verdict
                  </span>
                  <div className="text-base font-extrabold text-[#4A121A]">
                    {milanResult.verdict} ({milanResult.verdictHindi})
                  </div>
                  <p className="text-[10px] text-gray-700 mt-0.5">
                    {milanResult.verdictDescription}
                  </p>
                </div>
                <div className="text-right pl-4 border-l border-gray-300">
                  <div className="text-2xl font-black text-[#4A121A]">
                    {milanResult.totalScore} / {milanResult.maxScore}
                  </div>
                  <span className="text-[10px] font-bold text-gray-700">
                    {milanResult.percentage}% Guna Match
                  </span>
                </div>
              </div>

              {/* Ashtakoot 8-Factor Score Table */}
              <div className="mb-4 print-break-inside-avoid">
                <h4 className="font-bold text-xs uppercase text-[#4A121A] mb-1">
                  Ashtakoot Guna Milan Breakdown (36 Gunas)
                </h4>
                <table className="w-full text-[10px] border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-400">
                      <th className="border border-gray-400 p-1.5 text-left">#</th>
                      <th className="border border-gray-400 p-1.5 text-left">Koot Name</th>
                      <th className="border border-gray-400 p-1.5 text-left">Groom Attribute</th>
                      <th className="border border-gray-400 p-1.5 text-left">Bride Attribute</th>
                      <th className="border border-gray-400 p-1.5 text-center">Max</th>
                      <th className="border border-gray-400 p-1.5 text-center">Obtained</th>
                      <th className="border border-gray-400 p-1.5 text-left">Key Guidance / Remedy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milanResult.scores.map((koot: AshtakootScore, i: number) => (
                      <tr key={koot.name} className="border-b border-gray-300">
                        <td className="border border-gray-300 p-1.5 text-center">{i + 1}</td>
                        <td className="border border-gray-300 p-1.5 font-bold">
                          {koot.name} ({koot.nameHindi})
                        </td>
                        <td className="border border-gray-300 p-1.5">{koot.boyAttribute}</td>
                        <td className="border border-gray-300 p-1.5">{koot.girlAttribute}</td>
                        <td className="border border-gray-300 p-1.5 text-center font-bold">{koot.total}</td>
                        <td className="border border-gray-300 p-1.5 text-center font-extrabold">
                          {koot.obtained}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-[9.5px]">
                          {koot.remedy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Manglik Analysis & Forecast Summary */}
              <div className="border border-gray-400 p-2.5 rounded-sm mb-4 text-[10px] print-break-inside-avoid">
                <h4 className="font-bold text-xs uppercase text-[#4A121A] mb-1">
                  Manglik Dosha &amp; Vedic Forecast Summary
                </h4>
                <p className="mb-1">
                  <strong>Manglik Status:</strong> {milanResult.manglikAnalysis.details}
                </p>
                {milanResult.forecast && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-300">
                    <div>
                      <strong>आयु व स्वास्थ्य:</strong> {milanResult.forecast.lifeExpectancyOutlook}
                    </div>
                    <div>
                      <strong>वैचारिक सामंजस्य:</strong> {milanResult.forecast.mutualUnderstandingForecast}
                    </div>
                    <div>
                      <strong>आर्थिक समृद्धि:</strong> {milanResult.forecast.financialProspects}
                    </div>
                    <div>
                      <strong>संतान सुख:</strong> {milanResult.forecast.offspringFamilyOutlook}
                    </div>
                  </div>
                )}
              </div>

              {/* Official Seal / Signature Bar */}
              <div className="pt-3 border-t-2 border-[#4A121A] flex justify-between items-end text-[9.5px] text-gray-600 print-break-inside-avoid">
                <div>
                  <p className="font-bold text-[#4A121A]">RishteClub Matrimonial Verification Division</p>
                  <p>Helpline: +91-9871592002 • contact@rishteclub.com • rishteclub.com</p>
                  <p>Certified Vedic Astrological Horoscope Compatibility Record</p>
                </div>
                <div className="text-right">
                  <div className="border border-gray-400 px-3 py-1.5 inline-block text-[9px] uppercase tracking-wider font-bold text-gray-500">
                    [ OFFICIAL VERIFIED SEAL ]
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* OTP Verification Modal */}
      {isOtpModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E8DFD3] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsOtpModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#4A121A]/10 text-[#4A121A] flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6 text-[#4A121A]" />
              </div>
              <h3 className="text-xl font-bold text-[#4A121A] font-serif">
                Verify Your Mobile Number
              </h3>
              <p className="text-xs text-[#7A5835] mt-1">
                Enter your 10-digit phone to receive a quick verification code via SMS and reveal your Kundli Milan result.
              </p>
            </div>

            {otpError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>{otpError}</span>
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A3E39] mb-1.5 uppercase tracking-wider">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-12 pl-12 pr-4 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={sendingOtp || phone.replace(/\D/g, "").length < 10}
                  onClick={handleSendOtp}
                  className="w-full h-12 min-h-[48px] rounded-xl text-sm font-bold bg-[#4A121A] text-white hover:bg-[#601722] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {sendingOtp ? (
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending OTP via SMS...
                    </span>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD3] text-xs text-[#7A5835]">
                  OTP dispatched to <strong>+91 {phone.slice(0, 2)}******{phone.slice(-2)}</strong>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A3E39] mb-1.5 uppercase tracking-wider">
                    Enter 6-Digit OTP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-12 text-center tracking-widest text-lg font-bold rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059] bg-[#FFFDF9]"
                  />
                </div>

                <button
                  type="button"
                  disabled={verifyingOtp || otp.length < 4}
                  onClick={handleVerifyOtp}
                  className="w-full h-12 min-h-[48px] rounded-xl text-sm font-bold bg-[#4A121A] text-white hover:bg-[#601722] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {verifyingOtp ? (
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying &amp; Calculating Milan...
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#DFBA73]" />
                      Verify &amp; Reveal Milan Report
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-[#7A5835] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="hover:underline py-1.5"
                  >
                    Change Number
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || sendingOtp}
                    onClick={handleSendOtp}
                    className="text-[#4A121A] font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed py-1.5"
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delayed Registration Popup Modal (3.5 seconds delay) */}
      {showPricingPopup && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-[#C5A059] relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPricingPopup(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Decorative Top Accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#DFBA73]/20 pointer-events-none" />

            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#4A121A] text-[#DFBA73] border border-[#C5A059] mb-2">
                Exclusive RishteClub Membership
              </span>
              <h3 className="text-2xl font-extrabold text-[#4A121A] font-serif">
                Connect With 100% Verified Rishtey
              </h3>
              <p className="text-xs text-[#7A5835] mt-1 max-w-sm mx-auto">
                Ready to find an astrologically compatible match? Join RishteClub by NNVS Matrimony today.
              </p>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {/* Female Card */}
              <div className="rounded-2xl p-4 bg-gradient-to-b from-pink-50 to-white border border-pink-200 text-center relative">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-700 block mb-1">
                  Bride (Female)
                </span>
                <div className="text-2xl font-black text-[#4A121A]">
                  ₹471
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  ₹399 + 18% GST (₹72)
                </p>
                <div className="mt-3 pt-2.5 border-t border-pink-100 text-[11px] text-[#4A3E39] space-y-1">
                  <div className="flex items-center gap-1 justify-center">
                    <Check className="w-3.5 h-3.5 text-pink-600" /> Full Profile Visibility
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <Check className="w-3.5 h-3.5 text-pink-600" /> Direct Family Contact
                  </div>
                </div>
              </div>

              {/* Male Card */}
              <div className="rounded-2xl p-4 bg-gradient-to-b from-blue-50 to-white border border-blue-200 text-center relative">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                  Groom (Male)
                </span>
                <div className="text-2xl font-black text-[#4A121A]">
                  ₹943
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  ₹799 + 18% GST (₹144)
                </p>
                <div className="mt-3 pt-2.5 border-t border-blue-100 text-[11px] text-[#4A3E39] space-y-1">
                  <div className="flex items-center gap-1 justify-center">
                    <Check className="w-3.5 h-3.5 text-blue-600" /> Full Profile Visibility
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <Check className="w-3.5 h-3.5 text-blue-600" /> Direct Family Contact
                  </div>
                </div>
              </div>
            </div>

            {/* Helpline Information in Modal */}
            <div className="mb-5 p-3 rounded-xl bg-[#FAF5EB] border border-[#DACBB4] text-center text-xs text-[#4A121A]">
              <span className="font-bold block text-[#7A5835] text-[11px] uppercase tracking-wider mb-0.5">
                📞 Matrimonial Support &amp; Astrological Helpline
              </span>
              <div className="flex items-center justify-center gap-4 mt-1 font-bold">
                <a href="tel:+919871592002" className="text-[#4A121A] hover:underline flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5 text-[#C5A059]" />
                  +91-9871592002
                </a>
                <span className="text-gray-300">|</span>
                <a
                  href="https://wa.me/919871592002?text=Hello%20RishteClub%20Team%2C%20I%20checked%20Free%20Kundali%20Milan%20and%20want%20to%20register."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  WhatsApp Support
                </a>
              </div>
            </div>

            {/* Direct Register CTA */}
            <div className="space-y-3">
              <Link
                href={`/register?phone=${verifiedPhone}`}
                className="w-full h-12 min-h-[48px] rounded-xl font-bold text-sm bg-[#4A121A] text-white hover:bg-[#601722] active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2 border border-[#C5A059]"
              >
                <Sparkles className="w-4 h-4 text-[#DFBA73]" />
                Proceed to Register (+91 {verifiedPhone})
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setShowPricingPopup(false)}
                className="w-full min-h-[44px] flex items-center justify-center text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Continue Viewing Kundli Milan Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
