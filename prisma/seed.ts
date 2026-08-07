import {
  PrismaClient,
  Gender,
  UserRole,
  AccountStatus,
  ProfileApprovalStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 NNVS Seed Started...");

  await prisma.$transaction(async (tx) => {

    // ============================
    // CHECK EXISTING PROFILE
    // ============================

    const existing = await tx.profile.findUnique({
      where: {
        profileId: "NNVS-B-0005",
      },
    });

    if (existing) {
      console.log("⚠️ NNVS-B-0005 already exists.");
      return;
    }

    // ============================
    // USER
    // ============================

    const user = await tx.user.create({
      data: {
        fullName: "Bhopender Dhankar",

        mobile: "9540403071",

        email: null,

        password: null,

        gender: Gender.MALE,

        role: UserRole.MEMBER,

        status: AccountStatus.ACTIVE,

        mobileVerified: true,

        emailVerified: false,
      },
    });
        // ============================
    // PROFILE
    // ============================

    const profile = await tx.profile.create({
      data: {
        userId: user.id,

        profileId: "NNVS-B-0005",

        firstName: "Bhopender",

        lastName: "Dhankar",

        dateOfBirth: new Date("1990-03-04"),

        height: 175,

        maritalStatus: "Divorced",

        religion: null,

        caste: "Dhankar",

        motherTongue: null,

        isVisible: true,

        paymentCompleted: true,

        approvalStatus: ProfileApprovalStatus.APPROVED,
      },
    });

    // ============================
    // FAMILY
    // ============================

    await tx.family.create({
      data: {
        profileId: profile.id,

        fatherName: "Sarjit Singh Dhankar",

        motherName: "Birma Devi",

        brothers: 1,

        sisters: 0,

        familyType: "Nuclear",

        familyStatus: "Owned",
      },
    });

    // ============================
    // EDUCATION
    // ============================

    await tx.education.create({
      data: {
        profileId: profile.id,

        highestQualification: "BBA MBA LLB",

        college: null,

        occupationField: "Law",
      },
    });

    // ============================
    // OCCUPATION
    // ============================

    await tx.occupation.create({
      data: {
        profileId: profile.id,

        profession: "Advocate",

        company: null,

        annualIncome: "50000",
      },
    });

    // ============================
    // PARTNER PREFERENCE
    // ============================

    await tx.partnerPreference.create({
      data: {
        profileId: profile.id,
      },
    });

    console.log("✅ Added:", profile.profileId);
      });

  console.log("🎉 Seed Completed Successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seed Error:", error);

    await prisma.$disconnect();

    process.exit(1);
  });