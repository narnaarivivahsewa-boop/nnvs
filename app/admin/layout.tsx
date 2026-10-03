"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  FileText,
  Copy,
  FileSpreadsheet,
  Settings,
  Menu,
  X,
  LogOut,
  ExternalLink,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Profiles",
    href: "/admin/profiles",
    icon: Users,
  },
  {
    title: "Pending Approvals",
    href: "/admin/approvals",
    icon: UserCheck,
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    title: "GST Invoices",
    href: "/admin/invoices",
    icon: FileText,
  },
  {
    title: "Duplicate Profiles",
    href: "/admin/duplicates",
    icon: Copy,
  },
  {
    title: "Google Form Imports",
    href: "/admin/google-forms",
    icon: FileSpreadsheet,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const getPageTitle = () => {
    const item = navItems.find((n) => n.href === pathname);
    return item ? item.title : "Admin Panel";
  };

  return (
    <div className="min-h-screen bg-[#F4EFEA] flex flex-col lg:flex-row pb-16 lg:pb-0">
      {/* Desktop Sidebar (Hidden on mobile) */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#300B11] text-white border-r border-[#4A121A] shrink-0 min-h-screen">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#4A121A] bg-[#24060B]">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-black font-serif-luxury text-white tracking-tight">
              Rishte<span className="text-[#DFBA73]">Club</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#DFBA73] mt-0.5">
              Admin Portal &bull; NNVS
            </p>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-[#DFBA73] text-[#300B11] shadow-md font-bold"
                    : "text-[#D9C4B0] hover:bg-[#4A121A] hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-[#300B11]" : "text-[#DFBA73]"}`} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#4A121A] bg-[#24060B] space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-xl bg-[#3A0F17] px-3.5 py-2.5 text-xs font-semibold text-[#DFBA73] hover:bg-[#4A121A] transition"
          >
            <span>View Live Website</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-900/40 px-3.5 py-2.5 text-xs font-bold text-red-200 hover:bg-red-900/60 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (Sticky) */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between bg-[#300B11] px-4 text-white shadow-md border-b border-[#4A121A]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-1.5 text-white hover:bg-[#4A121A] transition"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5 text-[#DFBA73]" />
          </button>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight leading-none">
              {getPageTitle()}
            </h2>
            <span className="text-[10px] text-[#DFBA73] font-mono">RishteClub Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/profiles"
            className="rounded-lg bg-[#4A121A] px-2.5 py-1 text-[11px] font-bold text-[#DFBA73] border border-[#C5A059]/30"
          >
            Profiles
          </Link>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-72 max-w-[80vw] bg-[#300B11] text-white shadow-2xl z-10 min-h-screen">
            <div className="flex items-center justify-between p-4 border-b border-[#4A121A] bg-[#24060B]">
              <div>
                <h3 className="text-lg font-black font-serif-luxury text-white">
                  Rishte<span className="text-[#DFBA73]">Club</span>
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#DFBA73]">
                  Admin Mobile Panel
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-[#DFBA73] text-[#300B11] font-bold shadow"
                        : "text-[#D9C4B0] hover:bg-[#4A121A] hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-[#300B11]" : "text-[#DFBA73]"}`} />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#4A121A] bg-[#24060B] space-y-2">
              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between rounded-xl bg-[#3A0F17] px-3.5 py-2 text-xs font-semibold text-[#DFBA73]"
              >
                <span>Live Website</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-900/40 px-3.5 py-2 text-xs font-bold text-red-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation Bar (Sticky on phones) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#300B11] border-t border-[#4A121A] flex items-center justify-around py-1.5 px-2 shadow-lg">
        <Link
          href="/admin"
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-bold ${
            pathname === "/admin" ? "text-[#DFBA73]" : "text-[#A6938D]"
          }`}
        >
          <LayoutDashboard className="h-4 w-4 mb-0.5" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/admin/profiles"
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-bold ${
            pathname === "/admin/profiles" ? "text-[#DFBA73]" : "text-[#A6938D]"
          }`}
        >
          <Users className="h-4 w-4 mb-0.5" />
          <span>Profiles</span>
        </Link>

        <Link
          href="/admin/approvals"
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-bold ${
            pathname === "/admin/approvals" ? "text-[#DFBA73]" : "text-[#A6938D]"
          }`}
        >
          <UserCheck className="h-4 w-4 mb-0.5" />
          <span>Approvals</span>
        </Link>

        <Link
          href="/admin/payments"
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-bold ${
            pathname === "/admin/payments" ? "text-[#DFBA73]" : "text-[#A6938D]"
          }`}
        >
          <CreditCard className="h-4 w-4 mb-0.5" />
          <span>Payments</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-bold text-[#A6938D]"
        >
          <Menu className="h-4 w-4 mb-0.5 text-[#DFBA73]" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}