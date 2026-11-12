import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import fs from "fs";
import path from "path";

const safeUserBackupSelect = {
  id: true,
  fullName: true,
  mobile: true,
  email: true,
  gender: true,
  role: true,
  status: true,
  mobileVerified: true,
  emailVerified: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

// Helper to escape CSV values
function escapeCsv(val: any) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "stats"; // 'stats' | 'profiles-csv' | 'invoices-csv' | 'json' | 'create-disk-backup'

    if (type === "stats") {
      const [totalProfiles, totalPayments, totalInvoices, totalUsers] = await Promise.all([
        prisma.profile.count(),
        prisma.payment.count(),
        prisma.payment.count({ where: { invoiceNumber: { not: null } } }),
        prisma.user.count(),
      ]);

      // Check existing backups on disk cleanly
      const backupsDir = path.join(/* turbopackIgnore: true */ process.cwd(), "backups");
      let diskBackups: string[] = [];
      try {
        if (fs.existsSync(backupsDir)) {
          diskBackups = fs
            .readdirSync(backupsDir)
            .filter((f) => fs.statSync(path.join(backupsDir, f)).isDirectory());
        }
      } catch {
        diskBackups = [];
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
      const backupDir = path.join(/* turbopackIgnore: true */ process.cwd(), "backups", `backup-${timestamp}`);

      const [profiles, payments, users, settings] = await Promise.all([
        prisma.profile.findMany({
          include: {
            user: { select: safeUserBackupSelect },
            photos: true,
            family: true,
            education: true,
            occupation: true,
            partnerPreference: true,
            phoneNumbers: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.payment.findMany({
          include: { user: { select: safeUserBackupSelect } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
          select: safeUserBackupSelect,
          orderBy: { createdAt: "desc" },
        }),
        prisma.adminSetting.findFirst(),
      ]);

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

      try {
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        fs.writeFileSync(
          path.join(backupDir, "full-database-snapshot.json"),
          JSON.stringify(fullSnapshot, null, 2),
          "utf-8"
        );
      } catch (fsError) {
        console.error("Disk backup filesystem write error:", fsError);
        return NextResponse.json(
          {
            success: false,
            message: "Server filesystem is read-only. Please use JSON or CSV download instead.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Local backup created successfully at: backups/backup-${timestamp}`,
        backupPath: `backups/backup-${timestamp}`,
        timestamp,
      });
    }

    if (type === "profiles-csv") {
      const profiles = await prisma.profile.findMany({
        include: {
          user: { select: { fullName: true, gender: true, mobile: true } },
          family: { select: { fatherName: true, motherName: true } },
          education: { select: { highestQualification: true } },
          occupation: { select: { profession: true, company: true, annualIncome: true } },
        },
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
        include: { user: { select: { fullName: true, mobile: true } } },
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
      const [profiles, payments, users, settings] = await Promise.all([
        prisma.profile.findMany({
          include: {
            user: { select: safeUserBackupSelect },
            photos: true,
            family: true,
            education: true,
            occupation: true,
            phoneNumbers: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.payment.findMany({
          include: { user: { select: safeUserBackupSelect } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
          select: safeUserBackupSelect,
          orderBy: { createdAt: "desc" },
        }),
        prisma.adminSetting.findFirst(),
      ]);

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
  } catch (error) {
    console.error("Backup API Error:", error);
    return NextResponse.json({ success: false, message: "Backup operation failed." }, { status: 500 });
  }
}
