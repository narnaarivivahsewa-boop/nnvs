"use client";

import { useEffect, useState } from "react";
import {
  Download,
  HardDrive,
  FileSpreadsheet,
  FileText,
  Database,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  FolderArchive,
} from "lucide-react";

export default function AdminBackupPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creatingLocalBackup, setCreatingLocalBackup] = useState(false);
  const [localBackupMessage, setLocalBackupMessage] = useState<string | null>(null);

  async function loadStats() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/backup?type=stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load backup stats:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handleCreateLocalBackup() {
    try {
      setCreatingLocalBackup(true);
      setLocalBackupMessage(null);
      const res = await fetch("/api/admin/backup?type=create-disk-backup");
      const data = await res.json();
      if (data.success) {
        setLocalBackupMessage(`✅ Backup successfully saved to your computer disk at: ${data.backupPath}`);
        loadStats();
      } else {
        setLocalBackupMessage(`❌ Failed: ${data.message}`);
      }
    } catch (err) {
      setLocalBackupMessage("❌ Failed to create local backup.");
    } finally {
      setCreatingLocalBackup(false);
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif">
            System Data Backup & Local Export Hub
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Save and export all profiles, GST invoices, payments, and users directly to your local computer disk.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateLocalBackup}
          disabled={creatingLocalBackup}
          className="inline-flex items-center gap-2 rounded-xl bg-[#4A121A] px-5 py-3 text-sm font-bold text-white shadow hover:bg-[#380D13] transition disabled:opacity-50"
        >
          <HardDrive className={`h-4 w-4 text-[#DFBA73] ${creatingLocalBackup ? "animate-spin" : ""}`} />
          <span>{creatingLocalBackup ? "Saving to Disk..." : "1-Click Save Full Backup to Disk"}</span>
        </button>
      </div>

      {localBackupMessage && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{localBackupMessage}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-[#E2D4BE] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Profiles</span>
            <FileSpreadsheet className="h-5 w-5 text-[#4A121A]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#4A121A]">
            {loading ? "..." : stats?.totalProfiles || 0}
          </p>
          <span className="text-[11px] text-gray-500">Live Matrimony Records</span>
        </div>

        <div className="rounded-2xl bg-white border border-[#E2D4BE] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">GST Invoices</span>
            <FileText className="h-5 w-5 text-[#C5A059]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#4A121A]">
            {loading ? "..." : stats?.totalInvoices || 0}
          </p>
          <span className="text-[11px] text-gray-500">Tax Invoices Generated</span>
        </div>

        <div className="rounded-2xl bg-white border border-[#E2D4BE] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Payments & Exempt</span>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#4A121A]">
            {loading ? "..." : stats?.totalPayments || 0}
          </p>
          <span className="text-[11px] text-gray-500">Billing Records</span>
        </div>

        <div className="rounded-2xl bg-white border border-[#E2D4BE] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Disk Snapshots</span>
            <FolderArchive className="h-5 w-5 text-[#7A1F2D]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#4A121A]">
            {loading ? "..." : stats?.diskBackupsCount || 0}
          </p>
          <span className="text-[11px] text-gray-500">Saved in /backups folder</span>
        </div>
      </div>

      {/* Direct Export Options */}
      <div className="rounded-3xl bg-white border border-[#E2D4BE] p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-[#4A121A] font-serif border-b border-[#F2E8D7] pb-3">
          Download Files Directly to Your Computer
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profiles CSV */}
          <div className="rounded-2xl border border-[#DACBB4] bg-[#FAF8F5] p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-6 w-6 text-[#4A121A]" />
                <h3 className="font-bold text-gray-900 text-base">Export All Profiles (CSV / Excel)</h3>
              </div>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Includes full candidate biodata: name, mobile, DOB, education, profession, family background, and photo links.
              </p>
            </div>

            <a
              href="/api/admin/backup?type=profiles-csv"
              download
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-[#4A121A] py-2.5 px-4 text-xs font-bold text-[#4A121A] hover:bg-[#FAF0DC] transition shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>Download Profiles CSV</span>
            </a>
          </div>

          {/* GST Invoices CSV */}
          <div className="rounded-2xl border border-[#DACBB4] bg-[#FAF8F5] p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5">
                <FileText className="h-6 w-6 text-[#C5A059]" />
                <h3 className="font-bold text-gray-900 text-base">Export GST Tax Invoices (CSV)</h3>
              </div>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Includes invoice numbers, SAC code 998319, GSTIN 06APYPD6931J1ZE, taxable value, and 18% GST breakdown for accountant & CA.
              </p>
            </div>

            <a
              href="/api/admin/backup?type=invoices-csv"
              download
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-[#4A121A] py-2.5 px-4 text-xs font-bold text-[#4A121A] hover:bg-[#FAF0DC] transition shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>Download GST Invoices CSV</span>
            </a>
          </div>

          {/* Full JSON Database Snapshot */}
          <div className="rounded-2xl border border-[#DACBB4] bg-[#FAF8F5] p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Database className="h-6 w-6 text-[#7A1F2D]" />
                <h3 className="font-bold text-gray-900 text-base">Full JSON Database Snapshot</h3>
              </div>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Complete relational backup of all database tables (users, profiles, payments, settings) in standard JSON format.
              </p>
            </div>

            <a
              href="/api/admin/backup?type=json"
              download
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-[#4A121A] py-2.5 px-4 text-xs font-bold text-[#4A121A] hover:bg-[#FAF0DC] transition shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>Download Full JSON Backup</span>
            </a>
          </div>

          {/* Local Disk Folder Info */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5">
                <HardDrive className="h-6 w-6 text-emerald-800" />
                <h3 className="font-bold text-emerald-950 text-base">Local Computer Storage Path</h3>
              </div>
              <p className="mt-2 text-xs text-emerald-900 leading-relaxed font-mono">
                c:\Users\APPLE\nnvs-matrimony\backups\
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">
                Every time you click &ldquo;Save Full Backup to Disk&rdquo;, a new timestamped folder is saved permanently on your computer.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreateLocalBackup}
              disabled={creatingLocalBackup}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 py-2.5 px-4 text-xs font-bold text-white hover:bg-emerald-900 transition shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{creatingLocalBackup ? "Saving..." : "Create New Snapshot Now"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
