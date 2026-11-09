import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

const LEENA_USER_ID = "cmw6vxhfm0000jv07tt83t135";
const LEENA_PROFILE_CUID = "cmw6vxi4z0002jv07hm920c8x";
const COLLIDED_SOURCE_ID =
  "1gN9Xlq78evneaMxz8mXVn-RKMIZAfYHQgiDf_jwULSM_1333877254_row_653";

const LALIT_MOBILE = "9812309375";
const LALIT_EMAIL = "lalitkumarmehta33@gmail.com";
const DEFAULT_PASSWORD = "NNVS@RC2026";

async function main() {
  console.log("================================================================================");
  console.log("REPAIRING COLLIDED ACCOUNT: SEPARATING LALIT MEHTA FROM LEENA TANEJA (NNVS-G-0138)");
  console.log("================================================================================");

  // Verify Leena Taneja's collided record exists
  const leenaUser = await prisma.user.findUnique({
    where: { id: LEENA_USER_ID },
    include: {
      profiles: {
        include: {
          phoneNumbers: true,
          family: true,
          education: true,
          occupation: true,
          partnerPreference: true,
        },
      },
    },
  });

  if (!leenaUser) {
    throw new Error(`Expected Leena Taneja user (${LEENA_USER_ID}) not found.`);
  }

  const leenaProfile = leenaUser.profiles.find((p) => p.id === LEENA_PROFILE_CUID);
  if (!leenaProfile) {
    throw new Error(`Expected Leena Taneja profile (${LEENA_PROFILE_CUID}) not found.`);
  }

  // Check if Lalit Mehta already has a standalone User
  const existingLalitUser = await prisma.user.findUnique({
    where: { mobile: LALIT_MOBILE },
    include: { profiles: true },
  });

  if (existingLalitUser) {
    console.log(
      `Standalone User for Lalit Mehta already exists (${existingLalitUser.id}). Updating cleanly...`
    );
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Generate unique official-style RC Profile ID as requested (e.g., RC<timestamp>_3710)
  let newLalitProfileId = `RC${Date.now()}_3710`;
  while (await prisma.profile.findUnique({ where: { profileId: newLalitProfileId } })) {
    newLalitProfileId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const result = await prisma.$transaction(async (tx) => {
    // =========================================================================
    // STEP 2 FIRST: Clean Up Leena Taneja's Account (NNVS-G-0138)
    // (Must release email & unique sourceId before attaching them to Lalit)
    // =========================================================================

    // 2.1 Remove Lalit's phone 9812309375 from Leena's ProfilePhone
    const removedPhones = await tx.profilePhone.deleteMany({
      where: {
        profileId: LEENA_PROFILE_CUID,
        phone: LALIT_MOBILE,
      },
    });

    // Ensure Leena's primary phone 9899375357 remains intact
    await tx.profilePhone.upsert({
      where: {
        profileId_phone: {
          profileId: LEENA_PROFILE_CUID,
          phone: "9899375357",
        },
      },
      create: {
        profileId: LEENA_PROFILE_CUID,
        phone: "9899375357",
        isPrimary: true,
      },
      update: {
        isPrimary: true,
      },
    });

    // 2.2 Revert Leena's User.email from Lalit's email -> null & ensure FEMALE gender
    const updatedLeenaUser = await tx.user.update({
      where: { id: LEENA_USER_ID },
      data: {
        fullName: "Leena Taneja",
        email: null,
        gender: "FEMALE",
      },
    });

    // 2.3 Clear Lalit's overwritten bio/family/education/occupation/partnerPreference
    // and release row_653 sourceId while keeping Leena's legacyProfileId NNVS-G-0138
    await tx.partnerPreference.deleteMany({ where: { profileId: LEENA_PROFILE_CUID } });
    await tx.family.deleteMany({ where: { profileId: LEENA_PROFILE_CUID } });
    await tx.education.deleteMany({ where: { profileId: LEENA_PROFILE_CUID } });
    await tx.occupation.deleteMany({ where: { profileId: LEENA_PROFILE_CUID } });

    const updatedLeenaProfile = await tx.profile.update({
      where: { id: LEENA_PROFILE_CUID },
      data: {
        firstName: "Leena",
        lastName: "Taneja",
        legacyProfileId: "NNVS-G-0138",
        sourceId: null,
        oldNnvsId: null,
        dateOfBirth: null,
        height: null,
        maritalStatus: null,
        birthPlace: null,
        birthTime: null,
        diet: null,
        manglik: null,
        contactPerson: null,
        notes: null,
        isVisible: false,
        paymentRemark:
          "Recovered from row_653 collision with Lalit Mehta - re-sync Leena Taneja biodata from Google Sheet",
      },
    });

    // =========================================================================
    // STEP 1: Create Fresh Standalone Account for Lalit Mehta (Website RC ID only)
    // =========================================================================

    let lalitUser = existingLalitUser
      ? await tx.user.update({
          where: { id: existingLalitUser.id },
          data: {
            fullName: "Lalit Mehta",
            email: LALIT_EMAIL,
            gender: "MALE",
            role: "MEMBER",
            status: "ACTIVE",
            mobileVerified: true,
            password: passwordHash,
            mustChangePassword: true,
          },
        })
      : await tx.user.create({
          data: {
            fullName: "Lalit Mehta",
            mobile: LALIT_MOBILE,
            email: LALIT_EMAIL,
            gender: "MALE",
            role: "MEMBER",
            status: "ACTIVE",
            mobileVerified: true,
            emailVerified: false,
            password: passwordHash,
            mustChangePassword: true,
          },
        });

    let lalitProfile = existingLalitUser?.profiles?.[0]
      ? await tx.profile.update({
          where: { id: existingLalitUser.profiles[0].id },
          data: {
            legacyProfileId: null,
            oldNnvsId: null,
          },
        })
      : null;

    if (!lalitProfile) {
      // DOB: 07/11/1995 09:15 AM IST -> 1995-11-07T09:15:00+05:30 (1995-11-07T03:45:00.000Z)
      const dobIst = new Date("1995-11-07T09:15:00+05:30");

      lalitProfile = await tx.profile.create({
        data: {
          userId: lalitUser.id,
          profileId: newLalitProfileId,
          legacyProfileId: null,
          source: "GOOGLE_FORM",
          sourceId: COLLIDED_SOURCE_ID,
          firstName: "Lalit",
          lastName: "Mehta",
          approvalStatus: "PAYMENT_PENDING",
          paymentCompleted: false,
          isPaymentExempted: false,
          isVisible: false,
          paymentRemark: "Google Form Backup Lead - Pending Payment",
          dateOfBirth: dobIst,
          birthTime: "09:15 AM",
          birthPlace: "Hisar",
          notes: "House no. 91 Hariom Nagar, Agroha, Hisar",
          contactPerson: "Surender Kumar",
          height: "5'9\"",
          maritalStatus: "Never Married",
          diet: "Veg",
          manglik: "Yes",
          consentGeneral: true,
          consentSocialMedia: false,
          education: {
            create: {
              highestQualification: "B.Com",
              occupationField: "B.Com",
            },
          },
          occupation: {
            create: {
              profession: "B.Com",
              annualIncome: "6-7 Lakh",
            },
          },
          family: {
            create: {
              fatherName: "Sh Surender Kumar",
              motherName: "Smt Sunita Devi",
              motherOccupation: "Anganwadi service",
              brothers: 0,
              sisters: 2,
              siblingsDetails: "2 sisters married",
              familyStatus: "Owned",
              familyType: "Joint",
            },
          },
          partnerPreference: {
            create: {
              preferredCaste: "FEMALE / Girl",
            },
          },
          phoneNumbers: {
            create: {
              phone: LALIT_MOBILE,
              isPrimary: true,
            },
          },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "SEPARATE_COLLIDED_PROFILE",
        module: "DATA_REPAIR",
        details: JSON.stringify({
          reason: "Resolved row_653 sourceId collision between Leena Taneja and Lalit Mehta",
          leenaProfileId: updatedLeenaProfile.profileId,
          leenaLegacyId: updatedLeenaProfile.legacyProfileId,
          removedPhoneCountFromLeena: removedPhones.count,
          lalitUserId: lalitUser.id,
          lalitProfileId: lalitProfile.profileId,
          lalitLegacyId: lalitProfile.legacyProfileId,
          lalitApprovalStatus: lalitProfile.approvalStatus,
        }),
      },
    });

    return {
      removedPhonesCount: removedPhones.count,
      updatedLeenaUser,
      updatedLeenaProfile,
      lalitUser,
      lalitProfile,
    };
  });

  console.log("\n=== CLEANUP & CREATION SUMMARY ===");
  console.log("Removed Lalit phone from Leena ProfilePhone count:", result.removedPhonesCount);
  console.log("Leena User:", {
    id: result.updatedLeenaUser.id,
    fullName: result.updatedLeenaUser.fullName,
    mobile: result.updatedLeenaUser.mobile,
    email: result.updatedLeenaUser.email,
    gender: result.updatedLeenaUser.gender,
  });
  console.log("Leena Profile:", {
    id: result.updatedLeenaProfile.id,
    profileId: result.updatedLeenaProfile.profileId,
    legacyProfileId: result.updatedLeenaProfile.legacyProfileId,
    firstName: result.updatedLeenaProfile.firstName,
    lastName: result.updatedLeenaProfile.lastName,
    sourceId: result.updatedLeenaProfile.sourceId,
    approvalStatus: result.updatedLeenaProfile.approvalStatus,
    isVisible: result.updatedLeenaProfile.isVisible,
  });
  console.log("Lalit User:", {
    id: result.lalitUser.id,
    fullName: result.lalitUser.fullName,
    mobile: result.lalitUser.mobile,
    email: result.lalitUser.email,
    gender: result.lalitUser.gender,
    role: result.lalitUser.role,
    mustChangePassword: result.lalitUser.mustChangePassword,
  });
  console.log("Lalit Profile:", {
    id: result.lalitProfile.id,
    profileId: result.lalitProfile.profileId,
    legacyProfileId: result.lalitProfile.legacyProfileId,
    sourceId: result.lalitProfile.sourceId,
    approvalStatus: result.lalitProfile.approvalStatus,
    paymentCompleted: result.lalitProfile.paymentCompleted,
    isPaymentExempted: result.lalitProfile.isPaymentExempted,
    isVisible: result.lalitProfile.isVisible,
  });
}

main()
  .catch((err) => {
    console.error("ERROR repairing Lalit Mehta / Leena Taneja accounts:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

