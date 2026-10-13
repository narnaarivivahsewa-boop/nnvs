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
          { profiles: { some: { phoneNumbers: { some: { phone: mobileLookup } } } } },
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

    let profiles: any[] = [];
    let activeProfileId: string | null = null;
    let requiresProfileSelection = false;
    let redirectTo = "/dashboard";

    if (effectiveRole === "ADMIN") {
      redirectTo = "/admin";
    } else {
      const userProfiles = await prisma.profile.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          profileId: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          paymentCompleted: true,
          approvalStatus: true,
          photos: {
            select: { imageUrl: true, isPrimary: true },
            take: 1,
          },
          user: {
            select: { gender: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      profiles = userProfiles.map((p) => ({
        id: p.id,
        profileId: p.profileId,
        firstName: p.firstName,
        lastName: p.lastName,
        gender: p.user?.gender || user.gender || null,
        photo: p.photos?.[0]?.imageUrl || null,
        dateOfBirth: p.dateOfBirth,
        paymentCompleted: p.paymentCompleted,
        approvalStatus: p.approvalStatus,
      }));

      if (profiles.length === 1) {
        activeProfileId = profiles[0].id;
        redirectTo = !profiles[0].paymentCompleted
          ? `/payment?profileId=${encodeURIComponent(profiles[0].profileId)}&name=${encodeURIComponent(
              user.fullName || ""
            )}&gender=${encodeURIComponent(user.gender || "")}`
          : "/dashboard";
      } else if (profiles.length > 1) {
        requiresProfileSelection = true;
        redirectTo = "/select-profile";
      } else {
        redirectTo = "/dashboard";
      }
    }

    // Generate JWT token
    const token = await generateToken(user.id, user.mobile, effectiveRole, activeProfileId);

    const response = NextResponse.json({
      success: true,
      message: requiresProfileSelection
        ? "Please select which profile to manage."
        : "Login successful.",
      userId: user.id,
      fullName: user.fullName,
      role: effectiveRole,
      requiresProfileSelection,
      activeProfileId,
      profiles,
      redirectTo,
    });

    response.cookies.set("nnvs_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    if (activeProfileId) {
      response.cookies.set("activeProfileId", activeProfileId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    } else if (requiresProfileSelection) {
      response.cookies.set("activeProfileId", "", {
        path: "/",
        maxAge: 0,
      });
    }

    return response;
  } catch (error: any) {
    console.error("Password Login Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
