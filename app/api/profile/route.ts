import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
    try {
        // ===========================
        // Get JWT Token
        // ===========================

        const token = req.cookies.get("nnvs_token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                {
                    status: 401,
                }
            );
        }

        // ===========================
        // Verify Token
        // ===========================

        const payload = await verifyToken(token);

        // ===========================
        // Fetch Profile
        // ===========================

        const profile = await prisma.profile.findUnique({
            where: {
                userId: payload.userId,
            },

            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        mobile: true,
                        email: true,
                        gender: true,
                        role: true,
                        status: true,
                    },
                },

                photos: true,

                family: true,

                education: true,

                occupation: true,

                partnerPreference: true,
            },
        });

        if (!profile) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Profile not found.",
                },
                {
                    status: 404,
                }
            );
        }

        // ===========================
        // Success
        // ===========================

        return NextResponse.json({
            success: true,
            profile,
        });

    } catch (error) {
        console.error("PROFILE API ERROR =>", error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
            },
            {
                status: 500,
            }
        );
    }
}
export async function PUT(req: NextRequest) {
    try {
        // ===========================
        // Verify User
        // ===========================

        const token = req.cookies.get("nnvs_token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                {
                    status: 401,
                }
            );
        }

        const payload = await verifyToken(token);

        const body = await req.json();

        const {
            fullName,
            dateOfBirth,
            height,
            maritalStatus,
            religion,
            caste,
            motherTongue,

            fatherName,
            motherName,
            brothers,
            sisters,
            familyType,
            familyStatus,

            highestQualification,
            college,
            occupationField,

            profession,
            company,
            annualIncome,

            minAge,
            maxAge,
            minHeight,
            maxHeight,
            preferredReligion,
            preferredCaste,
        } = body;

        // ===========================
        // Find Profile
        // ===========================

        const profile = await prisma.profile.findUnique({
            where: {
                userId: payload.userId,
            },
        });

        if (!profile) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Profile not found.",
                },
                {
                    status: 404,
                }
            );
        }

        // ===========================
        // Transaction
        // ===========================

        await prisma.$transaction(async (tx) => {

            // -------------------------
            // Update User
            // -------------------------

            await tx.user.update({
                where: {
                    id: payload.userId,
                },
                data: {
                    fullName,
                },
            });

            // -------------------------
            // Update Profile
            // -------------------------

            await tx.profile.update({
                where: {
                    id: profile.id,
                },
                data: {
                    firstName: fullName,

                    dateOfBirth: dateOfBirth
                        ? new Date(dateOfBirth)
                        : null,

                    height:
                        height && height !== ""
                            ? parseInt(height)
                            : null,

                    maritalStatus,
                    religion,
                    caste,
                    motherTongue,
                },
            });
            // -------------------------
            // Update Family
            // -------------------------

            await tx.family.update({
                where: {
                    profileId: profile.id,
                },
                data: {
                    fatherName,
                    motherName,

                    brothers:
                        brothers && brothers !== ""
                            ? parseInt(brothers)
                            : 0,

                    sisters:
                        sisters && sisters !== ""
                            ? parseInt(sisters)
                            : 0,

                    familyType,
                    familyStatus,
                },
            });

            // -------------------------
            // Update Education
            // -------------------------

            await tx.education.update({
                where: {
                    profileId: profile.id,
                },
                data: {
                    highestQualification,
                    college,
                    occupationField,
                },
            });

            // -------------------------
            // Update Occupation
            // -------------------------

            await tx.occupation.update({
                where: {
                    profileId: profile.id,
                },
                data: {
                    profession,
                    company,
                    annualIncome,
                },
            });

            // -------------------------
            // Update Partner Preference
            // -------------------------

            await tx.partnerPreference.update({
                where: {
                    profileId: profile.id,
                },
                data: {
                    minAge:
                        minAge && minAge !== ""
                            ? parseInt(minAge)
                            : null,

                    maxAge:
                        maxAge && maxAge !== ""
                            ? parseInt(maxAge)
                            : null,

                    minHeight:
                        minHeight && minHeight !== ""
                            ? parseInt(minHeight)
                            : null,

                    maxHeight:
                        maxHeight && maxHeight !== ""
                            ? parseInt(maxHeight)
                            : null,

                    preferredReligion,
                    preferredCaste,
                },
            });
            // -------------------------
            // Transaction Complete
            // -------------------------

        });

        // ===========================
        // Success Response
        // ===========================

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully.",
        });

    } catch (error) {
        console.error("PROFILE UPDATE ERROR =>", error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
            },
            {
                status: 500,
            }
        );
    }
}