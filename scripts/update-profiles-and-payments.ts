import { prisma } from "../lib/prisma";

async function main() {
  console.log("==================================================");
  console.log("UPDATING PROFILES, APPROVALS & PAYMENT EXEMPTIONS");
  console.log("==================================================");

  // 1. Target Profiles: Monus Malhotra & Lokesh Anand
  // Put them in Admin Approval Pending (UNDER_REVIEW) and hide from Live Website
  const targetProfiles = await prisma.profile.findMany({
    where: {
      OR: [
        {
          AND: [
            { firstName: { contains: "Monus", mode: "insensitive" } },
            { lastName: { contains: "Malhotra", mode: "insensitive" } }
          ]
        },
        {
          AND: [
            { firstName: { contains: "Lokesh", mode: "insensitive" } },
            { lastName: { contains: "Anand", mode: "insensitive" } }
          ]
        },
        { sourceId: { contains: "row_627" } }, // Monus Malhotra
        { sourceId: { contains: "row_630" } }  // Lokesh Anand
      ]
    },
    include: { user: true }
  });

  console.log(`Found ${targetProfiles.length} profiles for Monus Malhotra & Lokesh Anand:`);
  for (const p of targetProfiles) {
    console.log(`- Updating ${p.firstName} ${p.lastName} (${p.profileId}) -> PENDING ADMIN APPROVAL (UNDER_REVIEW), isVisible: false`);
    await prisma.profile.update({
      where: { id: p.id },
      data: {
        isVisible: false,
        approvalStatus: "UNDER_REVIEW",
        paymentCompleted: false,
        paymentRemark: "Pending Admin Approval & Fee Verification",
      }
    });

    // Delete or mark any existing payment as pending
    await prisma.payment.deleteMany({
      where: {
        OR: [
          { profileId: p.id },
          { userId: p.userId }
        ]
      }
    });
  }

  // 2. All other profiles: Ensure Payment Exempt with Reason "NNVS ki old profile - Fees Exempt"
  const allOtherProfiles = await prisma.profile.findMany({
    where: {
      id: { notIn: targetProfiles.map(p => p.id) }
    },
    include: { user: true }
  });

  console.log(`\nProcessing payment exemption for ${allOtherProfiles.length} remaining profiles...`);

  let paymentsCreated = 0;
  let paymentsUpdated = 0;

  for (const p of allOtherProfiles) {
    // Update profile fields
    await prisma.profile.update({
      where: { id: p.id },
      data: {
        paymentCompleted: true,
        paymentRemark: "NNVS Old Profile - Fees Exempted",
        // Keep approval as APPROVED and isVisible as true for legacy profiles
        approvalStatus: "APPROVED",
        isVisible: true
      }
    });

    // Ensure payment record exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        OR: [
          { profileId: p.id },
          { userId: p.userId }
        ]
      }
    });

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          profileId: p.id,
          amount: 0,
          grossAmount: 0,
          taxableAmount: 0,
          gstRate: 0,
          gstAmount: 0,
          status: "SUCCESS",
          paymentGateway: "PAYMENT_EXEMPT",
          adminNotes: "NNVS Old Profile - Fees Exempted (Old Registered Candidate)",
          confirmedByAdmin: true,
          confirmedAt: existingPayment.confirmedAt || new Date(),
        }
      });
      paymentsUpdated++;
    } else {
      await prisma.payment.create({
        data: {
          userId: p.userId,
          profileId: p.id,
          amount: 0,
          grossAmount: 0,
          taxableAmount: 0,
          gstRate: 0,
          gstAmount: 0,
          status: "SUCCESS",
          paymentGateway: "PAYMENT_EXEMPT",
          adminNotes: "NNVS Old Profile - Fees Exempted (Old Registered Candidate)",
          confirmedByAdmin: true,
          confirmedAt: new Date(),
          paymentDate: p.createdAt || new Date(),
        }
      });
      paymentsCreated++;
    }
  }

  console.log(`\n✅ Payment Exempt summary: ${paymentsCreated} created, ${paymentsUpdated} updated.`);

  // 3. Verify Final Stats
  const totalProfiles = await prisma.profile.count();
  const liveProfiles = await prisma.profile.count({ where: { isVisible: true, approvalStatus: "APPROVED" } });
  const pendingProfiles = await prisma.profile.count({ where: { approvalStatus: "UNDER_REVIEW" } });
  const exemptPaymentsCount = await prisma.payment.count({ where: { paymentGateway: "PAYMENT_EXEMPT", status: "SUCCESS" } });
  const withLegacyCount = await prisma.profile.count({ where: { legacyProfileId: { not: null } } });

  console.log("\n--- FINAL VERIFICATION STATS ---");
  console.log({
    totalProfiles,
    liveApprovedProfiles: liveProfiles,
    pendingAdminApprovalProfiles: pendingProfiles,
    exemptPaymentsCount,
    profilesWithOldNNVSId: withLegacyCount
  });

  const pendingList = await prisma.profile.findMany({
    where: { approvalStatus: "UNDER_REVIEW" },
    select: { profileId: true, firstName: true, lastName: true, isVisible: true, approvalStatus: true, paymentCompleted: true }
  });
  console.log("\nPending Admin Review Profiles:", pendingList);
}

main().catch(console.error).finally(() => prisma.$disconnect());
