import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/jwt";
import { isPermanentAdmin } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username || body.mobile || "").trim();
    const password = String(body.password || "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username/Mobile and Password are required." },
        { status: 400 }
      );
    }

    const digitsOnly = username.replace(/\D/g, "");
    const mobileLookup = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    // 1. Find user by mobile or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile: mobileLookup },
          { mobile: username },
          { email: username.toLowerCase() },
        ],
      },
    });

    // Special Master Admin check for permanent admin numbers (9871592002, 9577540005)
    const isAdminAccount = isPermanentAdmin(mobileLookup) || (user && user.role === "ADMIN");
    const isMasterPassword = password === "Ritika@0612";

    if (isAdminAccount && isMasterPassword) {
      if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await prisma.user.create({
          data: {
            fullName: mobileLookup === "9577540005" ? "Rahul Dhamija" : "NNVS Admin",
            mobile: mobileLookup,
            password: hashedPassword,
            role: "ADMIN",
            status: "ACTIVE",
            mobileVerified: true,
          },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "ADMIN",
            status: "ACTIVE",
            mobileVerified: true,
          },
        });
      }
    } else {
      if (!user) {
        return NextResponse.json(
          { success: false, message: "Invalid username or mobile number." },
          { status: 401 }
        );
      }

      if (!user.password) {
        return NextResponse.json(
          { success: false, message: "Password not configured. Please login using Mobile OTP." },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: "Incorrect password. Please try again." },
          { status: 401 }
        );
      }
    }

    const effectiveRole = (isAdminAccount || user.role === "ADMIN") ? "ADMIN" : user.role;

    // Generate JWT token
    const token = await generateToken(user.id, user.mobile, effectiveRole);

    let userProfile = null;
    if (effectiveRole !== "ADMIN") {
      userProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { profileId: true, paymentCompleted: true },
      });
    }

    const defaultMemberRedirect = (userProfile && !userProfile.paymentCompleted)
      ? `/payment?profileId=${encodeURIComponent(userProfile.profileId)}&name=${encodeURIComponent(user.fullName || "")}&gender=${encodeURIComponent(user.gender || "")}`
      : "/dashboard";

    const redirectTo = effectiveRole === "ADMIN" ? "/admin" : defaultMemberRedirect;

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      userId: user.id,
      fullName: user.fullName,
      role: effectiveRole,
      redirectTo,
    });

    response.cookies.set("nnvs_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Password Login Error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
