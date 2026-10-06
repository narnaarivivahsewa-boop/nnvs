import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Helper to escape CSV values
function escapeCsv(val: any) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "stats"; // 'stats' | 'profiles-csv' | 'invoices-csv' | 'payments-csv' | 'json' | 'create-disk-backup'

    if (type === "stats") {
      const totalProfiles = await prisma.profile.count();
      const totalPayments = await prisma.payment.count();
      const totalInvoices = await prisma.payment.count({ where: { invoiceNumber: { not: null } } });
      const totalUsers = await prisma.user.count();

      // Check existing backups on disk
      const backupsDir = path.join(process.cwd(), "backups");
      let diskBackups: string[] = [];
      if (fs.existsSync(backupsDir)) {
        diskBackups = fs.readdirSync(backupsDir).filter((f) => fs.statSync(path.join(backupsDir, f)).isDirectory());
      }

      return NextResponse.json({
        success: true,
        stats: {
          totalProfiles,
          totalPayments,
          totalInvoices,
          totalUsers,
          diskBackupsCount: diskBackups.length,
          latestBackups: diskBackups.reverse().slice(0, 5),
        },
      });
    }

    if (type === "create-disk-backup") {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupDir = path.join(process.cwd(), "backups", `backup-${timestamp}`);
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const profiles = await prisma.profile.findMany({
        include: { user: true, photos: true, family: true, education: true, occupation: true, partnerPreference: true, phoneNumbers: true },
        orderBy: { createdAt: "desc" },
      });

      const payments = await prisma.payment.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });

      const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
      const settings = await prisma.adminSetting.findFirst();

      const fullSnapshot = {
        backupDate: new Date().toISOString(),
        stats: {
          totalProfiles: profiles.length,
          totalUsers: users.length,
          totalPayments: payments.length,
          totalInvoices: payments.filter((p) => p.invoiceNumber).length,
        },
        profiles,
        payments,
        users,
        settings,
      };

      fs.writeFileSync(path.join(backupDir, "full-database-snapshot.json"), JSON.stringify(fullSnapshot, null, 2), "utf-8");

      return NextResponse.json({
        success: true,
        message: `Local backup created successfully at: backups/backup-${timestamp}`,
        backupPath: `backups/backup-${timestamp}`,
        timestamp,
      });
    }

    if (type === "profiles-csv") {
      const profiles = await prisma.profile.findMany({
        include: { user: true, photos: true, family: true, education: true, occupation: true },
        orderBy: { createdAt: "desc" },
      });

      const headers = [
        "RishteClub ID", "Old NNVS ID", "Full Name", "Gender", "Mobile", "Date of Birth",
        "Birth Place", "Birth Time", "Manglik", "Marital Status", "Religion", "Caste",
        "Mother Tongue", "Height", "Diet", "Education", "Profession", "Company", "Income",
        "Father Name", "Mother Name", "Payment Status", "Approval Status", "Created At"
      ];

      const rows = profiles.map((p) => [
        escapeCsv(p.profileId),
        escapeCsv(p.legacyProfileId),
        escapeCsv(p.user?.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim()),
        escapeCsv(p.user?.gender),
        escapeCsv(p.user?.mobile),
        escapeCsv(p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split("T")[0] : ""),
        escapeCsv(p.birthPlace),
        escapeCsv(p.birthTime),
        escapeCsv(p.manglik),
        escapeCsv(p.maritalStatus),
        escapeCsv(p.religion),
        escapeCsv(p.caste),
        escapeCsv(p.motherTongue),
        escapeCsv(p.height),
        escapeCsv(p.diet),
        escapeCsv(p.education?.highestQualification),
        escapeCsv(p.occupation?.profession),
        escapeCsv(p.occupation?.company),
        escapeCsv(p.occupation?.annualIncome),
        escapeCsv(p.family?.fatherName),
        escapeCsv(p.family?.motherName),
        escapeCsv(p.paymentCompleted ? "COMPLETED" : "PENDING"),
        escapeCsv(p.approvalStatus),
        escapeCsv(p.createdAt ? new Date(p.createdAt).toISOString() : ""),
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="rishteclub-profiles-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    if (type === "invoices-csv") {
      const invoices = await prisma.payment.findMany({
        where: { invoiceNumber: { not: null } },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });

      const headers = [
        "Invoice Number", "Invoice Date", "Profile ID", "Customer Name", "Mobile",
        "Taxable Amount", "GST Rate", "GST Amount", "Gross Total", "Gateway", "Transaction ID", "Status"
      ];

      const rows = invoices.map((inv) => [
        escapeCsv(inv.invoiceNumber),
        escapeCsv(inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split("T")[0] : ""),
        escapeCsv(inv.profileId),
        escapeCsv(inv.user?.fullName),
        escapeCsv(inv.user?.mobile),
        escapeCsv(inv.taxableAmount || "0.00"),
        escapeCsv(inv.gstRate || "18.00"),
        escapeCsv(inv.gstAmount || "0.00"),
        escapeCsv(inv.grossAmount || inv.amount || "0.00"),
        escapeCsv(inv.paymentGateway),
        escapeCsv(inv.transactionId),
        escapeCsv(inv.status),
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="rishteclub-gst-invoices-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    if (type === "json") {
      const profiles = await prisma.profile.findMany({
        include: { user: true, photos: true, family: true, education: true, occupation: true, phoneNumbers: true },
        orderBy: { createdAt: "desc" },
      });

      const payments = await prisma.payment.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
      });

      const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
      const settings = await prisma.adminSetting.findFirst();

      const snapshot = {
        exportedAt: new Date().toISOString(),
        totalProfiles: profiles.length,
        totalPayments: payments.length,
        totalUsers: users.length,
        profiles,
        payments,
        users,
        settings,
      };

      return new NextResponse(JSON.stringify(snapshot, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="rishteclub-full-backup-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    }

    return NextResponse.json({ success: false, message: "Invalid backup type" }, { status: 400 });
  } catch (error: any) {
    console.error("Backup API Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Backup failed" }, { status: 500 });
  }
}
