import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { generateMissingPaidPdfs } from "@/lib/pdf/batch-generator";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const results = await generateMissingPaidPdfs();
    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error("ADMIN GENERATE MISSING PAID PDFS ERROR =>", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to generate missing paid PDFs." },
      { status: 500 }
    );
  }
}
