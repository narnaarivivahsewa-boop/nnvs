import { POST } from "../app/api/auth/login-password/route";
import { NextRequest } from "next/server";

async function test() {
  const req = new NextRequest("http://localhost:3000/api/auth/login-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "9871592002",
      password: "Ritika@0612",
    }),
  });

  const res = await POST(req);
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", data);
  console.log("Cookies set:", res.cookies.get("nnvs_token"));
}

test().catch(console.error);
