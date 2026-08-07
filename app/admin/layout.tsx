"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  CheckCircle,
  CreditCard,
  Store,
  Settings,
  LogOut,
} from "lucide-react";

const menus = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Members",
    href: "/admin/profiles",
    icon: Users,
  },
  {
    title: "Import Excel",
    href: "/admin/import",
    icon: FileSpreadsheet,
  },
  {
    title: "Approvals",
    href: "/admin/approvals",
    icon: CheckCircle,
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Vendors",
    href: "/admin/vendors",
    icon: Store,
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

  return (
    <div className="flex min-h-screen bg-gray-100">

      <aside className="hidden w-72 bg-red-700 text-white lg:block">

        <div className="border-b border-red-600 p-6">
          <h1 className="text-3xl font-bold">
            NNVS Admin
          </h1>

          <p className="mt-1 text-sm text-red-100">
            Matrimony Management
          </p>
        </div>

        <nav className="space-y-2 p-4">

          {menus.map((menu) => {
            const Icon = menu.icon;

            const active =
              pathname === menu.href;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                  active
                    ? "bg-white font-semibold text-red-700"
                    : "hover:bg-red-600"
                }`}
              >
                <Icon size={20} />
                {menu.title}
              </Link>
            );
          })}

        </nav>

      </aside>

      <div className="flex flex-1 flex-col">

        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">

          <h2 className="text-2xl font-bold">
            Admin Panel
          </h2>

        </header>

        <main className="flex-1 p-6">
          {children}
        </main>

      </div>

    </div>
  );
}