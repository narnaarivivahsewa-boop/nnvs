import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice & Receipt",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
