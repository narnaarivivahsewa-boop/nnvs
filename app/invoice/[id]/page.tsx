"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, CheckCircle2, ShieldCheck, Download, AlertCircle } from "lucide-react";

type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  status: string;
  transactionId: string;
  paymentGateway: string;
  seller: {
    legalName: string;
    tradeName: string;
    proprietor: string;
    gstin: string;
    stateName: string;
    stateCode: string;
    country: string;
    email: string;
    helplineNumbers: readonly string[];
    callingHours: string;
    brandName: string;
    managedBy: string;
    managedByFull: string;
    domain: string;
  };
  buyer: {
    name: string;
    mobile: string;
    email: string;
    profileId: string;
    state: string;
  };
  item: {
    description: string;
    sacCode: string;
    sacDescription: string;
    taxableAmount: number;
    cgstRate: string;
    cgstAmount: number;
    sgstRate: string;
    sgstAmount: number;
    igstRate: string;
    igstAmount: number;
    totalTax: number;
    totalAmount: number;
    amountInWords: string;
  };
  declaration: string;
};

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setLoading(true);
        const res = await fetch(`/api/invoice/${id}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.message || "Failed to load GST invoice.");
          return;
        }

        setInvoice(data.invoice);
      } catch (err) {
        console.error("Fetch invoice error:", err);
        setError("Error connecting to invoice server.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-800 border-t-transparent mb-4" />
        <p className="text-gray-600 font-semibold">Generating GST Tax Invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="rounded-3xl bg-white p-8 shadow-xl max-w-md w-full text-center border border-gray-100">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-sm text-gray-600 mb-6">{error || "Could not locate this tax invoice."}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-6 py-3 text-sm font-bold text-white shadow hover:bg-red-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const invoiceFormattedDate = new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F4EFEA] py-8 px-4 sm:px-6 print:bg-white print:p-0">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4A121A] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#380C13] transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main GST Invoice Sheet (A4 Styled) */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* Invoice Top Band */}
        <div className="bg-[#4A121A] text-white px-8 py-5 flex flex-wrap items-center justify-between border-b-2 border-[#DFBA73] print:bg-[#4A121A] print:text-white">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Rishte<span className="text-[#DFBA73]">Club</span>
              </span>
              <span className="text-[11px] uppercase tracking-wider text-[#DFBA73] bg-[#330B12] px-2.5 py-1 rounded-md font-medium border border-[#6B1F2D]">
                Managed by NNVS Matrimony
              </span>
            </div>
            <p className="text-xs text-[#E8D8C0] mt-1">
              Official Matrimonial Matchmaking Portal &bull; https://rishteclub.com
            </p>
          </div>

          <div className="text-right mt-2 sm:mt-0">
            <span className="inline-block bg-[#DFBA73] text-[#4A121A] text-xs font-black uppercase tracking-widest px-3 py-1 rounded">
              TAX INVOICE
            </span>
            <p className="text-[11px] text-[#E8D8C0] mt-1">Original for Recipient</p>
          </div>
        </div>

        <div className="p-8 sm:p-10 space-y-8 text-gray-800 text-sm">
          {/* Supplier & Invoice Meta Header */}
          <div className="grid sm:grid-cols-2 gap-6 pb-6 border-b border-gray-200">
            {/* Supplier / Seller (Trendy Traders) */}
            <div className="space-y-1.5 bg-[#FAF6EF] p-4 rounded-xl border border-[#E8DCC8]">
              <p className="text-xs font-bold text-[#8C6239] uppercase tracking-wider">
                Supplier / Seller (Billed By)
              </p>
              <h3 className="text-lg font-black text-[#4A121A]">
                {invoice.seller.tradeName}
              </h3>
              <p className="text-xs text-gray-700">
                <strong>Proprietor:</strong> {invoice.seller.proprietor}
              </p>
              <p className="text-xs text-gray-700">
                <strong>GSTIN:</strong> <span className="font-mono font-bold text-gray-900">{invoice.seller.gstin}</span>
              </p>
              <p className="text-xs text-gray-700">
                <strong>State:</strong> {invoice.seller.stateName} (Code: {invoice.seller.stateCode}), {invoice.seller.country}
              </p>
              <p className="text-xs text-gray-600">
                <strong>Email:</strong> {invoice.seller.email}
              </p>
              <p className="text-xs text-gray-600">
                <strong>Helpline:</strong> {invoice.seller.helplineNumbers.join(", ")}
              </p>
            </div>

            {/* Invoice & Buyer Details */}
            <div className="space-y-3 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block">Invoice Number:</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">{invoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Invoice Date:</span>
                  <span className="font-semibold text-gray-900">{invoiceFormattedDate}</span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-500 block">Payment Mode:</span>
                  <span className="font-semibold text-gray-900">{invoice.paymentGateway}</span>
                </div>
                <div className="mt-2">
                  <span className="text-gray-500 block">Transaction ID:</span>
                  <span className="font-mono text-gray-900 text-[11px] break-all">{invoice.transactionId}</span>
                </div>
              </div>

              {/* Billed To / Recipient */}
              <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#E8DCC8]">
                <p className="text-xs font-bold text-[#8C6239] uppercase tracking-wider">
                  Billed To (Customer / Recipient)
                </p>
                <h4 className="text-base font-bold text-gray-900">{invoice.buyer.name}</h4>
                <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-gray-700">
                  <p><strong>Profile ID:</strong> {invoice.buyer.profileId}</p>
                  <p><strong>Mobile:</strong> {invoice.buyer.mobile}</p>
                  {invoice.buyer.email !== "N/A" && (
                    <p className="col-span-2"><strong>Email:</strong> {invoice.buyer.email}</p>
                  )}
                  <p><strong>Place of Supply:</strong> {invoice.buyer.state} ({invoice.seller.stateCode})</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Invoice Item Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-300 text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#4A121A] text-white">
                  <th className="p-3 border border-gray-300 font-bold w-12 text-center">#</th>
                  <th className="p-3 border border-gray-300 font-bold">Description of Services</th>
                  <th className="p-3 border border-gray-300 font-bold text-center">SAC Code</th>
                  <th className="p-3 border border-gray-300 font-bold text-right">Taxable Value</th>
                  <th className="p-3 border border-gray-300 font-bold text-center">CGST (9%)</th>
                  <th className="p-3 border border-gray-300 font-bold text-center">SGST (9%)</th>
                  <th className="p-3 border border-gray-300 font-bold text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-300 hover:bg-gray-50">
                  <td className="p-3 border border-gray-300 text-center font-semibold">1</td>
                  <td className="p-3 border border-gray-300">
                    <p className="font-bold text-gray-900">{invoice.item.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">One-time Matrimonial Registration & Matchmaking Service</p>
                  </td>
                  <td className="p-3 border border-gray-300 text-center font-mono font-semibold">
                    {invoice.item.sacCode}
                  </td>
                  <td className="p-3 border border-gray-300 text-right font-semibold">
                    ₹{invoice.item.taxableAmount.toFixed(2)}
                  </td>
                  <td className="p-3 border border-gray-300 text-center">
                    ₹{invoice.item.cgstAmount.toFixed(2)}
                  </td>
                  <td className="p-3 border border-gray-300 text-center">
                    ₹{invoice.item.sgstAmount.toFixed(2)}
                  </td>
                  <td className="p-3 border border-gray-300 text-right font-bold text-gray-900">
                    ₹{invoice.item.totalAmount.toFixed(2)}
                  </td>
                </tr>

                {/* Calculation Summary Rows */}
                <tr className="bg-gray-50 font-medium">
                  <td colSpan={3} className="p-3 border border-gray-300 text-right font-bold">
                    Total Taxable Base:
                  </td>
                  <td className="p-3 border border-gray-300 text-right font-semibold">
                    ₹{invoice.item.taxableAmount.toFixed(2)}
                  </td>
                  <td className="p-3 border border-gray-300 text-center font-semibold">
                    ₹{invoice.item.cgstAmount.toFixed(2)}
                  </td>
                  <td className="p-3 border border-gray-300 text-center font-semibold">
                    ₹{invoice.item.sgstAmount.toFixed(2)}
                  </td>
                  <td className="p-3 border border-gray-300 text-right font-bold">
                    ₹{invoice.item.totalAmount.toFixed(2)}
                  </td>
                </tr>

                <tr className="bg-[#FAF6EF]">
                  <td colSpan={6} className="p-3 border border-gray-300 text-right font-bold text-base text-[#4A121A]">
                    Total Invoice Value (Inclusive of 18% GST):
                  </td>
                  <td className="p-3 border border-gray-300 text-right font-black text-lg text-[#4A121A]">
                    ₹{invoice.item.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="bg-[#FAF5EB] p-4 rounded-xl border border-[#DACBB4]">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
              Amount Chargeable (in words):
            </p>
            <p className="text-sm font-bold text-[#4A121A] mt-1">
              Indian Rupees {invoice.item.amountInWords}
            </p>
          </div>

          {/* Tax Summary & Legal Declaration */}
          <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-gray-200 text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Payment Status: Confirmed & Paid</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <strong>Tax Notice:</strong> Tax is charged under SAC Code 998399 as per applicable GST laws of the Government of India.
              </p>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                {invoice.declaration}
              </p>
            </div>

            {/* Authorized Signatory for Trendy Traders */}
            <div className="flex flex-col items-end justify-between text-right space-y-4">
              <div className="space-y-1">
                <p className="font-bold text-gray-900">For {invoice.seller.tradeName}</p>
                <p className="text-[11px] text-gray-500">(RishteClub &bull; Managed by NNVS Matrimony)</p>
              </div>

              <div className="pt-8">
                <div className="inline-block border-t border-gray-400 pt-1.5 px-6 text-center">
                  <p className="text-xs font-bold text-gray-900">{invoice.seller.proprietor}</p>
                  <p className="text-[11px] text-gray-500">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Footer Bar */}
        <div className="bg-[#24060B] text-white px-8 py-3 text-center text-xs text-[#DFBA73] border-t border-[#4A121A] print:bg-[#24060B] print:text-[#DFBA73]">
          <p>Thank you for choosing RishteClub (Managed by NNVS Matrimony). May God bless your journey towards a perfect match!</p>
        </div>
      </div>
    </div>
  );
}
