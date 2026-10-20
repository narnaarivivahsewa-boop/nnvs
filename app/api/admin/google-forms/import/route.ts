import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { POST as googleFormIntegrationHandler } from "@/app/api/integrations/google-form/route";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const integrationKey =
      (process.env.GOOGLE_FORM_INTEGRATION_KEY || "").replace(/["']/g, "").trim() ||
      "9377018194b7c3361ccd1c929de0d9d267c821544c05ff12ea64e5cabfdea20c";

    const internalReq = new NextRequest(new URL("/api/integrations/google-form", req.url), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-integration-key": integrationKey,
        authorization: `Bearer ${integrationKey}`,
      },
      body: JSON.stringify(body),
    });

    return await googleFormIntegrationHandler(internalReq);
  } catch (error: any) {
    console.error("ADMIN GOOGLE FORMS IMPORT ERROR =>", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to process Google Form import." },
      { status: 500 }
    );
  }
}
