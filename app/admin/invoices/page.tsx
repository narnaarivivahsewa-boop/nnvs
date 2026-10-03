"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadInvoices = useCallback(async (query: string = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/invoices?search=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.success) {
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error("Error loading invoices:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch(`/api/admin/invoices?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setInvoices(data.invoices || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif">GST Invoices</h1>
            <span className="bg-[#FAF5EB] text-[#7A5835] border border-[#DACBB4] text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Trendy Traders
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            GSTIN: <span className="font-mono font-bold text-gray-800">06APYPD6931J1ZE</span> • SAC Code: <span className="font-mono font-bold text-gray-800">998319</span> (Matrimonial Matchmaking Services)
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            loadInvoices(search);
          }}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 text-[#7A5835] ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Info Banner */}
      <div className="bg-white p-4 rounded-2xl border border-[#EBE3D5] shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Invoice Number, Profile ID, Old NNVS ID, candidate name, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7A5835] focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#7A5835] border-t-transparent mb-3" />
          <p className="text-gray-600 text-sm font-medium">Loading GST invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 font-serif">No Invoices Found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {search
              ? "No invoices matched your search criteria."
              : "Invoices will be automatically generated when offline membership payments are confirmed by the Admin."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card List */}
          <div className="grid grid-cols-1 md:hidden gap-3.5">
            {invoices.map((inv) => {
              const candidateName =
                `${inv.profile?.firstName || ""} ${inv.profile?.lastName || ""}`.trim() ||
                inv.user?.fullName ||
                "Candidate";

              return (
                <div
                  key={inv.id}
                  className="bg-white rounded-2xl border border-[#EBE3D5] p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#7A5835] bg-[#FAF5EB] px-2.5 py-0.5 rounded-md border border-[#DACBB4]">
                        {inv.invoiceNumber}
                      </span>
                      <h4 className="font-bold text-gray-900 text-base mt-2 font-serif">
                        {candidateName}
                      </h4>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">
                        {inv.profile?.profileId || "-"}
                        {inv.profile?.legacyProfileId && (
                          <span className="ml-1.5 text-amber-800 font-bold">
                            (Old: {inv.profile.legacyProfileId})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-[#4A121A]">
                        ₹{Number(inv.grossAmount || inv.amount).toFixed(2)}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Paid (GST Incl.)
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Details */}
                  <div className="bg-[#FAF8F5] p-3 rounded-xl text-xs space-y-1 text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Taxable Amount:</span>
                      <span className="font-mono font-semibold">₹{Number(inv.taxableAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">GST (18%):</span>
                      <span className="font-mono font-semibold">₹{Number(inv.gstAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">UTR / Ref:</span>
                      <span className="font-mono text-gray-600 break-all">{inv.transactionId || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span>
                        {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/invoice/${inv.id}`}
                      target="_blank"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#4A121A] text-white py-2 px-3 rounded-xl text-xs font-bold hover:bg-[#350d13] shadow-sm transition"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#C5A059]" />
                      <span>View & Print GST Invoice</span>
                      <ExternalLink className="h-3 w-3 text-white/70" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-[#EBE3D5] shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#4A121A] text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Invoice #</th>
                  <th className="px-4 py-3.5">Candidate / Profile</th>
                  <th className="px-4 py-3.5">Mobile</th>
                  <th className="px-4 py-3.5">Taxable (₹)</th>
                  <th className="px-4 py-3.5">GST 18% (₹)</th>
                  <th className="px-4 py-3.5">Gross Total (₹)</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => {
                  const candidateName =
                    `${inv.profile?.firstName || ""} ${inv.profile?.lastName || ""}`.trim() ||
                    inv.user?.fullName ||
                    "Candidate";

                  return (
                    <tr key={inv.id} className="hover:bg-[#FAF8F5] transition">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#7A5835]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">{candidateName}</div>
                        <div className="text-xs font-mono text-gray-500">
                          {inv.profile?.profileId || "-"}
                          {inv.profile?.legacyProfileId && (
                            <span className="ml-1 text-amber-800 font-bold">
                              ({inv.profile.legacyProfileId})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-700">
                        {inv.user?.mobile || "-"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-700">
                        ₹{Number(inv.taxableAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-700">
                        ₹{Number(inv.gstAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#4A121A]">
                        ₹{Number(inv.grossAmount || inv.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Link
                          href={`/invoice/${inv.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 bg-[#FAF5EB] text-[#7A5835] border border-[#DACBB4] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#F2E8D7] transition shadow-sm"
                        >
                          <FileText className="h-3.5 w-3.5 text-[#C5A059]" />
                          <span>View Invoice</span>
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
