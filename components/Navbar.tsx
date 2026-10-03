"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";

type UserType = {
  role?: string;
  fullName?: string | null;
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserType | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [pathname]);

  async function logout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      setUser(null);
      setLoggingOut(false);
      setMobileMenuOpen(false);
      router.push("/");
      router.refresh();
    }
  }

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Profiles", href: "/profiles" },
    { name: "Services", href: "/#services" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      {/* Top Auspicious Header Banner */}
      <div className="w-full bg-[#4A121A] py-1.5 text-center border-b border-[#6B1F2D]">
        <p className="text-xs sm:text-sm font-semibold tracking-wider text-[#DFBA73]">
          🙏 जय श्री श्याम 🙏
        </p>
      </div>

      <header className="sticky top-0 z-50 w-full bg-[#FAF6EF]/95 backdrop-blur-md border-b border-[#E8DCC8] shadow-sm transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          {/* Authentic Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/nnvs-logo.png"
              alt="RishteClub Matrimony"
              className="h-12 sm:h-14 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
            <div className="flex flex-col">
              <span className="font-serif-luxury text-xl sm:text-2xl font-bold tracking-tight text-[#4A121A]">
                RishteClub
              </span>
              <span className="text-[9.5px] uppercase tracking-[0.14em] font-semibold text-[#7A5835] -mt-0.5">
                Managed by NNVS Matrimony
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-[15px] font-medium transition-colors duration-200 relative py-1 ${
                    isActive
                      ? "text-[#4A121A] font-bold"
                      : "text-[#4A3E39] hover:text-[#4A121A]"
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#C5A059] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {!checkingAuth && !user && (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-[#4A121A] px-5 py-2 text-sm font-semibold text-[#4A121A] transition hover:bg-[#FAF0DC]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-[#C5A059] px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B88E4C] hover:shadow"
                >
                  Register Now
                </Link>
              </>
            )}

            {!checkingAuth && user && (
              <div className="flex items-center gap-3">
                <Link
                  href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
                  className="flex items-center gap-2 rounded-lg border border-[#C5A059] bg-[#FAF5EB] px-4 py-2 text-sm font-semibold text-[#4A121A] transition hover:bg-[#F2E8D7]"
                >
                  <LayoutDashboard className="h-4 w-4 text-[#C5A059]" />
                  <span>{user.role === "ADMIN" ? "Admin Panel" : "Dashboard"}</span>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 rounded-lg bg-[#4A121A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A0C13] disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{loggingOut ? "..." : "Logout"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-[#4A121A] hover:bg-[#F2E8D7] focus:outline-none transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E8DCC8] bg-[#FAF6EF] px-6 py-6 space-y-4 shadow-xl">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-lg px-4 py-2.5 text-base font-medium transition ${
                      isActive
                        ? "bg-[#F2E8D7] text-[#4A121A] font-semibold"
                        : "text-[#4A3E39] hover:bg-[#F5EFE3]"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-[#E8DCC8] pt-4 flex flex-col gap-3">
              {!checkingAuth && !user && (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-lg border border-[#4A121A] py-2.5 text-base font-semibold text-[#4A121A] hover:bg-[#FAF0DC] transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-lg bg-[#C5A059] py-2.5 text-base font-semibold text-white shadow hover:bg-[#B88E4C] transition"
                  >
                    Register Now
                  </Link>
                </>
              )}

              {!checkingAuth && user && (
                <>
                  <Link
                    href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#C5A059] py-2.5 text-base font-semibold text-[#4A121A] hover:bg-[#F2E8D7] transition"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[#C5A059]" />
                    <span>{user.role === "ADMIN" ? "Admin Panel" : "Dashboard"}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    disabled={loggingOut}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#4A121A] py-2.5 text-base font-semibold text-white shadow hover:bg-[#3A0C13] transition disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{loggingOut ? "Logging out..." : "Logout"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
