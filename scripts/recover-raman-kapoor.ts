import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

const RAMAN_USER_ID = "cmw651wmx0000jw08g6x40j61";
const RAMAN_PROFILE_CUID = "cmw651xco0002jw08k4fqlfny";
const RAMAN_MOBILE = "9027228558";
const RAMAN_EMAIL = "praveenkapoor164@gmail.com";
const RAMAN_LEGACY_ID = "NNVS-B-0509";
const RAMAN_ORIGINAL_APPROVED_AT = new Date("2026-11-08T05:07:09.603Z");

const CHAKSHU_STANDALONE_USER_ID = "cmw6cl9ux000hjt08ai62cbou";
const CHAKSHU_STANDALONE_PROFILE_CUID = "cmw6claj2000jjt08h5cwdx4n";
const CHAKSHU_MOBILE = "9255261671";
const CHAKSHU_LEGACY_ID = "NNVS-G-0140";

const DEFAULT_PASSWORD = "NNVS@RC2026";

async function main() {
  console.log("================================================================================");
  console.log("RECOVERING COLLIDED PROFILE: RAMAN KAPOOR (NNVS-B-0509) & SEPARATING CHAKSHU THAKRAL");
  console.log("================================================================================");

  // 1. Pre-flight verification
  const ramanUser = await prisma.user.findUnique({
    where: { id: RAMAN_USER_ID },
    include: {
      profiles: {
        include: {
          phoneNumbers: true,
          family: true,
          education: true,
          occupation: true,
          partnerPreference: true,
          photos: true,
        },
      },
      payments: true,
    },
  });

  if (!ramanUser) {
    throw new Error(`Expected Raman Kapoor user (${RAMAN_USER_ID}) not found.`);
  }

  if (ramanUser.mobile !== RAMAN_MOBILE) {
    throw new Error(
      `Unexpected mobile on ${RAMAN_USER_ID}: got "${ramanUser.mobile}", expected "${RAMAN_MOBILE}".`
    );
  }

  const ramanProfile = ramanUser.profiles.find((p) => p.id === RAMAN_PROFILE_CUID);
  if (!ramanProfile) {
    throw new Error(`Expected Raman Kapoor profile (${RAMAN_PROFILE_CUID}) not found.`);
  }

  const chakshuStandalone = await prisma.profile.findUnique({
    where: { id: CHAKSHU_STANDALONE_PROFILE_CUID },
    include: {
      user: true,
      phoneNumbers: true,
    },
  });

  if (!chakshuStandalone || chakshuStandalone.userId !== CHAKSHU_STANDALONE_USER_ID) {
    throw new Error(
      `Expected Chakshu Thakral standalone profile (${CHAKSHU_STANDALONE_PROFILE_CUID}) not found.`
    );
  }

  // Ensure NNVS-B-0509 isn't held by any other profile
  const conflictingB0509 = await prisma.profile.findMany({
    where: {
      legacyProfileId: { equals: RAMAN_LEGACY_ID, mode: "insensitive" },
      id: { not: RAMAN_PROFILE_CUID },
    },
    select: { id: true, profileId: true, firstName: true, lastName: true },
  });
  if (conflictingB0509.length > 0) {
    throw new Error(
      `Conflicting ${RAMAN_LEGACY_ID} found on another profile: ${JSON.stringify(conflictingB0509)}`
    );
  }

  // Ensure NNVS-G-0140 isn't held by any other profile besides the collided record & Chakshu
  const conflictingG0140 = await prisma.profile.findMany({
    where: {
      legacyProfileId: { equals: CHAKSHU_LEGACY_ID, mode: "insensitive" },
      id: { notIn: [RAMAN_PROFILE_CUID, CHAKSHU_STANDALONE_PROFILE_CUID] },
    },
    select: { id: true, profileId: true, firstName: true, lastName: true },
  });
  if (conflictingG0140.length > 0) {
    throw new Error(
      `Conflicting ${CHAKSHU_LEGACY_ID} found on unexpected profile: ${JSON.stringify(conflictingG0140)}`
    );
  }

  // Generate fresh bcrypt hash of NNVS@RC2026
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const passwordCheck = await bcrypt.compare(DEFAULT_PASSWORD, passwordHash);
  if (!passwordCheck) {
    throw new Error("Generated password hash failed bcrypt verification.");
  }

  // Generate official RC<timestamp>_3710 Profile ID (preserve if already migrated cleanly)
  const previousProfileId = ramanProfile.profileId;
  let officialProfileId = previousProfileId;
  if (!/^RC\d+_3710$/.test(officialProfileId)) {
    officialProfileId = `RC${Date.now()}_3710`;
    while (await prisma.profile.findUnique({ where: { profileId: officialProfileId } })) {
      officialProfileId = `RC${Date.now() + Math.floor(Math.random() * 100)}_3710`;
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // 2. Remove Chakshu's phone number(s) from Raman's profile and keep ONLY 9027228558
    const removedOtherPhones = await tx.profilePhone.deleteMany({
      where: {
        profileId: RAMAN_PROFILE_CUID,
        phone: { not: RAMAN_MOBILE },
      },
    });

    await tx.profilePhone.upsert({
      where: {
        profileId_phone: {
          profileId: RAMAN_PROFILE_CUID,
          phone: RAMAN_MOBILE,
        },
      },
      create: {
        profileId: RAMAN_PROFILE_CUID,
        phone: RAMAN_MOBILE,
        isPrimary: true,
      },
      update: {
        isPrimary: true,
      },
    });

    // 3. Remove Chakshu's overwritten relation records from Raman's profile
    const deletedPartnerPref = await tx.partnerPreference.deleteMany({
      where: { profileId: RAMAN_PROFILE_CUID },
    });
    const deletedFamily = await tx.family.deleteMany({
      where: { profileId: RAMAN_PROFILE_CUID },
    });
    const deletedEducation = await tx.education.deleteMany({
      where: { profileId: RAMAN_PROFILE_CUID },
    });
    const deletedOccupation = await tx.occupation.deleteMany({
      where: { profileId: RAMAN_PROFILE_CUID },
    });
    const deletedPhotos = await tx.profilePhoto.deleteMany({
      where: { profileId: RAMAN_PROFILE_CUID },
    });

    // 4. Restore Raman Kapoor's User record
    const updatedRamanUser = await tx.user.update({
      where: { id: RAMAN_USER_ID },
      data: {
        fullName: "Raman Kapoor",
        mobile: RAMAN_MOBILE,
        email: RAMAN_EMAIL,
        gender: "MALE",
        role: "MEMBER",
        status: "ACTIVE",
        mobileVerified: true,
        password: passwordHash,
        mustChangePassword: true,
      },
    });

    // 5. Restore Raman Kapoor's Profile record (preserving profile CUID for existing Payment FK)
    const updatedRamanProfile = await tx.profile.update({
      where: { id: RAMAN_PROFILE_CUID },
      data: {
        profileId: officialProfileId,
        legacyProfileId: RAMAN_LEGACY_ID,
        oldNnvsId: RAMAN_LEGACY_ID,
        source: "GOOGLE_FORM",
        sourceId: null, // Release collided row_649 link cleanly
        firstName: "Raman",
        lastName: "Kapoor",
        dateOfBirth: null,
        height: null,
        maritalStatus: null,
        religion: null,
        caste: null,
        motherTongue: null,
        birthPlace: null,
        birthTime: null,
        diet: null,
        manglik: null,
        contactPerson: null,
        consentSocialMedia: false,
        consentGeneral: true,
        otherMatrimonyInfo: null,
        notes: null,
        hobbies: null,
        interests: null,
        lifestyle: null,
        expectations: null,
        approvalStatus: "APPROVED",
        approvedAt: RAMAN_ORIGINAL_APPROVED_AT,
        isVisible: true,
        paymentCompleted: true,
        isPaymentExempted: true,
        paymentExemptionReason: "Old legacy NNVS record without payment",
        paymentRemark:
          "Recovered from row_649 collision with Chakshu Thakral (NNVS-G-0140) - original biodata (DOB/education/family/photo) pending Google Form re-sync",
        isDuplicateFlagged: false,
        duplicateMatchedProfileId: null,
        duplicateNotes: null,
      },
    });

    // 6. Restore NNVS-G-0140 onto Chakshu Thakral's standalone profile cleanly
    await tx.profilePhone.deleteMany({
      where: {
        profileId: CHAKSHU_STANDALONE_PROFILE_CUID,
        phone: RAMAN_MOBILE,
      },
    });

    const updatedChakshuProfile = await tx.profile.update({
      where: { id: CHAKSHU_STANDALONE_PROFILE_CUID },
      data: {
        legacyProfileId: chakshuStandalone.legacyProfileId || CHAKSHU_LEGACY_ID,
        oldNnvsId: CHAKSHU_LEGACY_ID,
      },
    });

    // 7. Write AuditLog record
    const auditLog = await tx.auditLog.create({
      data: {
        action: "RECOVER_COLLIDED_PROFILE",
        module: "DATA_REPAIR",
        details: JSON.stringify({
          reason:
            "Resolved row_649 sourceId collision where Chakshu Thakral (NNVS-G-0140) overwrote Raman Kapoor (NNVS-B-0509)",
          ramanUserId: updatedRamanUser.id,
          ramanProfileCuid: updatedRamanProfile.id,
          previousProfileId,
          recoveredProfileId: updatedRamanProfile.profileId,
          ramanLegacyId: updatedRamanProfile.legacyProfileId,
          ramanMobile: updatedRamanUser.mobile,
          ramanApprovalStatus: updatedRamanProfile.approvalStatus,
          ramanIsVisible: updatedRamanProfile.isVisible,
          removedOtherPhonesCount: removedOtherPhones.count,
          clearedOverwrittenRelations: {
            partnerPreference: deletedPartnerPref.count,
            family: deletedFamily.count,
            education: deletedEducation.count,
            occupation: deletedOccupation.count,
            photos: deletedPhotos.count,
          },
          chakshuStandaloneUserId: CHAKSHU_STANDALONE_USER_ID,
          chakshuStandaloneProfileCuid: updatedChakshuProfile.id,
          chakshuProfileId: updatedChakshuProfile.profileId,
          chakshuLegacyId: updatedChakshuProfile.legacyProfileId,
          chakshuMobile: CHAKSHU_MOBILE,
        }),
      },
    });

    return {
      removedOtherPhonesCount: removedOtherPhones.count,
      clearedRelations: {
        partnerPreference: deletedPartnerPref.count,
        family: deletedFamily.count,
        education: deletedEducation.count,
        occupation: deletedOccupation.count,
        photos: deletedPhotos.count,
      },
      updatedRamanUser,
      updatedRamanProfile,
      updatedChakshuProfile,
      auditLog,
    };
  });

  console.log("\n=== RECOVERY & SEPARATION SUMMARY ===");
  console.log("Removed non-Raman phone links count:", result.removedOtherPhonesCount);
  console.log("Cleared Chakshu overwritten relations:", result.clearedRelations);
  console.log("Raman Kapoor User:", {
    id: result.updatedRamanUser.id,
    fullName: result.updatedRamanUser.fullName,
    mobile: result.updatedRamanUser.mobile,
    email: result.updatedRamanUser.email,
    gender: result.updatedRamanUser.gender,
    role: result.updatedRamanUser.role,
    status: result.updatedRamanUser.status,
    mobileVerified: result.updatedRamanUser.mobileVerified,
    mustChangePassword: result.updatedRamanUser.mustChangePassword,
  });
  console.log("Raman Kapoor Profile:", {
    id: result.updatedRamanProfile.id,
    profileId: result.updatedRamanProfile.profileId,
    legacyProfileId: result.updatedRamanProfile.legacyProfileId,
    oldNnvsId: result.updatedRamanProfile.oldNnvsId,
    firstName: result.updatedRamanProfile.firstName,
    lastName: result.updatedRamanProfile.lastName,
    approvalStatus: result.updatedRamanProfile.approvalStatus,
    isVisible: result.updatedRamanProfile.isVisible,
    paymentCompleted: result.updatedRamanProfile.paymentCompleted,
    isPaymentExempted: result.updatedRamanProfile.isPaymentExempted,
    sourceId: result.updatedRamanProfile.sourceId,
  });
  console.log("Chakshu Thakral Standalone Profile:", {
    id: result.updatedChakshuProfile.id,
    profileId: result.updatedChakshuProfile.profileId,
    legacyProfileId: result.updatedChakshuProfile.legacyProfileId,
    oldNnvsId: result.updatedChakshuProfile.oldNnvsId,
    approvalStatus: result.updatedChakshuProfile.approvalStatus,
    isVisible: result.updatedChakshuProfile.isVisible,
  });
  console.log("AuditLog ID:", result.auditLog.id);
}

main()
  .catch((err) => {
    console.error("ERROR recovering Raman Kapoor profile:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

