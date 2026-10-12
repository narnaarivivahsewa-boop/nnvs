import { NextRequest } from "next/server";
import { POST as handleLoginPassword } from "../login-password/route";

export async function POST(req: NextRequest) {
  return handleLoginPassword(req);
}
