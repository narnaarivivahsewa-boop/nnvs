import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register Biodata",
  description: "Create your matrimonial profile on RishteClub.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
