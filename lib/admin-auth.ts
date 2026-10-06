import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

type AdminAuthResult =
  | {
      authorized: true;
      user: Awaited<ReturnType<typeof verifyToken>>;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

export const PERMANENT_ADMIN_NUMBERS = ["9871592002", "9577540005"];

export function isPermanentAdmin(mobile?: string | null): boolean {
  if (!mobile) return false;
  const digits = String(mobile).replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  return PERMANENT_ADMIN_NUMBERS.includes(last10);
}

export async function requireAdmin(
  req: NextRequest
): Promise<AdminAuthResult> {
  const token = req.cookies.get("nnvs_token")?.value;

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  try {
    const payload = await verifyToken(token);

    if (payload.role !== "ADMIN" && !isPermanentAdmin(payload.mobile)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, message: "Forbidden" },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      user: {
        ...payload,
        role: "ADMIN",
      },
    };
  } catch {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
}
