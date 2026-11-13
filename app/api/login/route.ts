import { NextRequest } from "next/server";
import { POST as handleLoginPassword } from "@/app/api/auth/login-password/route";

export async function POST(req: NextRequest) {
  return handleLoginPassword(req);
}