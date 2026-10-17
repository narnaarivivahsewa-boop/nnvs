import { prisma } from "../lib/prisma";

function normalizeName(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/^(mr\.|mrs\.|ms\.|shri|smt\.|dr\.)\s+/i, "")
    .replace(/\s*\([^)]*\)/g, "") // remove notes like (my son), (puniyani), etc.
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function getProfileGender(profile: {
  legacyProfileId: string | null;
  oldNnvsId: string | null;
  user?: { gender: string | null } | null;
}): string {
  const legacy = (profile.legacyProfileId || profile.oldNnvsId || "").toUpperCase();
  if (
    legacy.includes("-G-") ||
    legacy.startsWith("NNVS-G") ||
    legacy.startsWith("G-") ||
    legacy.startsWith("G0")
  ) {
    return "FEMALE";
  }
  if (
    legacy.includes("-B-") ||
    legacy.startsWith("NNVS-B") ||
    legacy.startsWith("B-") ||
    legacy.startsWith("B0")
  ) {
    return "MALE";
  }
  return profile.user?.gender || "UNKNOWN";
}

async function fixSharedMobileSiblings() {
  console.log("==================================================================");
  console.log("Starting Sibling / Multi-Profile Consolidation & Duplicate Cleanup");
  console.log("==================================================================\n");

  const initialUserCount = await prisma.user.count();
  const initialProfileCount = await prisma.profile.count();
  const initialFlaggedCount = await prisma.profile.count({
    where: { isDuplicateFlagged: true },
  });

  console.log(`Initial DB State:`);
  console.log(`  Users: ${initialUserCount}`);
  console.log(`  Profiles: ${initialProfileCount}`);
  console.log(`  Flagged Duplicates: ${initialFlaggedCount}\n`);

  // 1. Fetch all profiles with their user and phone numbers
  const allProfiles = await prisma.profile.findMany({
    include: {
      user: true,
      phoneNumbers: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // 2. Map profiles to their primary 10-digit mobile number
  const phoneToProfiles = new Map<string, typeof allProfiles>();

  for (const p of allProfiles) {
    const primaryPhoneObj =
      p.phoneNumbers.find((ph) => ph.isPrimary) || p.phoneNumbers[0];
    const rawPhone = primaryPhoneObj?.phone || p.user?.mobile || "";
    const cleanPhone = rawPhone
      .replace(/_r\d+.*$/, "")
      .replace(/\D/g, "")
      .slice(-10);

    if (!cleanPhone || cleanPhone.length < 10) continue;

    const list = phoneToProfiles.get(cleanPhone) || [];
    list.push(p);
    phoneToProfiles.set(cleanPhone, list);
  }

  let groupsProcessed = 0;
  let profilesLinked = 0;
  let siblingsUnflagged = 0;
  let genuineDuplicatesFlagged = 0;
  let dummyUsersDeleted = 0;

  for (const [cleanPhone, group] of phoneToProfiles.entries()) {
    if (group.length <= 1) continue;

    groupsProcessed++;
    console.log(`------------------------------------------------------------------`);
    console.log(`[Group ${groupsProcessed}] Phone: ${cleanPhone} (${group.length} profiles)`);

    // a. Determine or find the primary User
    let primaryUser = await prisma.user.findUnique({
      where: { mobile: cleanPhone },
    });

    if (!primaryUser) {
      // Find candidate among users in this group that might have the clean phone or oldest
      const nonDummyUser = group.find(
        (p) => p.user && !p.user.mobile.includes("_r")
      )?.user;

      if (nonDummyUser) {
        primaryUser = nonDummyUser;
        if (primaryUser.mobile !== cleanPhone) {
          primaryUser = await prisma.user.update({
            where: { id: primaryUser.id },
            data: { mobile: cleanPhone },
          });
        }
      } else {
        // All users in this group have _r. Pick the earliest created user and clean mobile
        const earliestUser = group
          .map((p) => p.user)
          .filter(Boolean)
          .sort((a, b) => a!.createdAt.getTime() - b!.createdAt.getTime())[0];

        if (earliestUser) {
          primaryUser = await prisma.user.update({
            where: { id: earliestUser.id },
            data: { mobile: cleanPhone },
          });
        }
      }
    }

    if (!primaryUser) {
      console.warn(`  [WARN] Could not resolve a primary user for phone ${cleanPhone}`);
      continue;
    }

    // Ensure primary user is active and verified
    await prisma.user.update({
      where: { id: primaryUser.id },
      data: {
        mobileVerified: true,
        status: "ACTIVE",
      },
    });

    console.log(`  Primary Account User: ${primaryUser.fullName || "Member"} (ID: ${primaryUser.id}, Mobile: ${primaryUser.mobile})`);

    // b. Classify profiles in this group: Legitimate Siblings vs Genuine Candidate Duplicates
    const seenCandidates: {
      profileId: string;
      fullName: string;
      nameNorm: string;
      gender: string;
      dob: string;
    }[] = [];

    const dummyUserIdsToDelete = new Set<string>();

    for (let i = 0; i < group.length; i++) {
      const p = group[i];
      const pFullName =
        `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
        p.user?.fullName ||
        `Profile ${p.profileId}`;
      const nameNorm = normalizeName(pFullName);
      const gender = getProfileGender(p);
      const dobStr = p.dateOfBirth?.toISOString().slice(0, 10) || "NO_DOB";

      // Check if duplicate of an earlier profile in this group
      const duplicateOf = seenCandidates.find((prev) => {
        const sameName = prev.nameNorm.length >= 3 && prev.nameNorm === nameNorm;
        const sameGender = prev.gender === gender && gender !== "UNKNOWN";
        const sameDob = prev.dob === dobStr && dobStr !== "NO_DOB";
        const oppositeGender =
          (prev.gender === "MALE" && gender === "FEMALE") ||
          (prev.gender === "FEMALE" && gender === "MALE");

        // Opposite genders (brother and sister) can NEVER be duplicates
        if (oppositeGender) return false;

        // If names match and (gender matches or DOB matches)
        if (sameName && (sameGender || sameDob)) return true;
        if (sameName && prev.dob === "NO_DOB" && dobStr === "NO_DOB") return true;

        return false;
      });

      if (duplicateOf) {
        // Genuine duplicate candidate profile
        genuineDuplicatesFlagged++;
        console.log(
          `  -> [GENUINE DUPLICATE] Profile ${p.profileId} (${p.legacyProfileId || "No Legacy ID"}): "${pFullName}", Gender: ${gender}, DOB: ${dobStr} -> DUPLICATE OF ${duplicateOf.profileId}`
        );

        await prisma.profile.update({
          where: { id: p.id },
          data: {
            userId: primaryUser.id,
            isDuplicateFlagged: true,
            duplicateMatchedProfileId: duplicateOf.profileId,
            duplicateNotes: `Duplicate candidate: matches profile ${duplicateOf.profileId} (${duplicateOf.fullName}) with same contact number ${cleanPhone}.`,
          },
        });
        profilesLinked++;
      } else {
        // Legitimate sibling / unique candidate profile
        siblingsUnflagged++;
        seenCandidates.push({
          profileId: p.profileId,
          fullName: pFullName,
          nameNorm,
          gender,
          dob: dobStr,
        });

        console.log(
          `  -> [LEGITIMATE SIBLING] Profile ${p.profileId} (${p.legacyProfileId || "No Legacy ID"}): "${pFullName}", Gender: ${gender}, DOB: ${dobStr} -> LINKED TO ${primaryUser.id} (Unflagged)`
        );

        await prisma.profile.update({
          where: { id: p.id },
          data: {
            userId: primaryUser.id,
            isDuplicateFlagged: false,
            duplicateMatchedProfileId: null,
            duplicateNotes: null,
          },
        });
        profilesLinked++;
      }

      // Check if p.user was a dummy user with _r
      if (
        p.user &&
        p.user.id !== primaryUser.id &&
        p.user.mobile.includes("_r")
      ) {
        dummyUserIdsToDelete.add(p.user.id);
      }
    }

    // c. Reassign foreign key records from dummy users to primaryUser, then delete dummy users
    for (const dummyId of dummyUserIdsToDelete) {
      // Reassign payments
      await prisma.payment.updateMany({
        where: { userId: dummyId },
        data: { userId: primaryUser.id },
      });

      // Reassign subscriptions
      await prisma.subscription.updateMany({
        where: { userId: dummyId },
        data: { userId: primaryUser.id },
      });

      // Reassign login history
      await prisma.loginHistory.updateMany({
        where: { userId: dummyId },
        data: { userId: primaryUser.id },
      });

      // Reassign notifications
      await prisma.notification.updateMany({
        where: { userId: dummyId },
        data: { userId: primaryUser.id },
      });

      // Reassign audit logs
      await prisma.auditLog.updateMany({
        where: { userId: dummyId },
        data: { userId: primaryUser.id },
      });

      // Remove any participant links
      await prisma.conversationParticipant.deleteMany({
        where: { userId: dummyId },
      });

      // Check if dummy user has remaining profiles
      const remainingProfiles = await prisma.profile.count({
        where: { userId: dummyId },
      });

      if (remainingProfiles === 0) {
        await prisma.user.delete({
          where: { id: dummyId },
        });
        dummyUsersDeleted++;
      }
    }
  }

  // 3. Global Cleanup for any remaining profiles flagged with old bogus duplicate notes
  const remainingOldNotes = await prisma.profile.findMany({
    where: {
      isDuplicateFlagged: true,
      OR: [
        { duplicateNotes: { contains: "Multi-profile account: shares phone" } },
        { duplicateNotes: { contains: "Shares contact number" } },
      ],
    },
    include: { user: true },
  });

  console.log(`\nChecking for remaining profiles with old multi-profile notes: ${remainingOldNotes.length}`);
  for (const p of remainingOldNotes) {
    console.log(
      `  Clearing bogus flag for Profile ${p.profileId} (${p.firstName} ${p.lastName})`
    );
    await prisma.profile.update({
      where: { id: p.id },
      data: {
        isDuplicateFlagged: false,
        duplicateMatchedProfileId: null,
        duplicateNotes: null,
      },
    });
    siblingsUnflagged++;
  }

  // 3b. Sweep any remaining orphaned dummy users with _r and 0 profiles
  const orphanedDummyUsers = await prisma.user.findMany({
    where: {
      mobile: { contains: "_r" },
      profiles: { none: {} },
    },
  });
  for (const du of orphanedDummyUsers) {
    await prisma.payment.deleteMany({ where: { userId: du.id } });
    await prisma.loginHistory.deleteMany({ where: { userId: du.id } });
    await prisma.subscription.deleteMany({ where: { userId: du.id } });
    await prisma.auditLog.deleteMany({ where: { userId: du.id } });
    await prisma.notification.deleteMany({ where: { userId: du.id } });
    await prisma.conversationParticipant.deleteMany({ where: { userId: du.id } });
    await prisma.user.delete({ where: { id: du.id } });
    dummyUsersDeleted++;
    console.log(`  Deleted orphaned dummy user ${du.id} (${du.mobile})`);
  }

  // 4. Final verification and counts
  const finalUserCount = await prisma.user.count();
  const finalProfileCount = await prisma.profile.count();
  const finalFlaggedCount = await prisma.profile.count({
    where: { isDuplicateFlagged: true },
  });

  const finalMultiProfileUsers = await prisma.user.findMany({
    where: {
      profiles: {
        some: {},
      },
    },
    include: {
      profiles: {
        select: {
          profileId: true,
          legacyProfileId: true,
          firstName: true,
          lastName: true,
          isDuplicateFlagged: true,
        },
      },
    },
  });

  const multiProfileCount = finalMultiProfileUsers.filter(
    (u) => u.profiles.length > 1
  ).length;

  console.log(`\n==================================================================`);
  console.log(`CLEANUP COMPLETE SUMMARY`);
  console.log(`==================================================================`);
  console.log(`Shared Phone Groups Processed:        ${groupsProcessed}`);
  console.log(`Profiles Consolidated/Re-linked:       ${profilesLinked}`);
  console.log(`Legitimate Siblings Unflagged (false): ${siblingsUnflagged}`);
  console.log(`Genuine Duplicates Preserved (true):   ${genuineDuplicatesFlagged}`);
  console.log(`Dummy _r Users Deleted:               ${dummyUsersDeleted}`);
  console.log(`Users with Multiple Profiles Now:     ${multiProfileCount}`);
  console.log(`------------------------------------------------------------------`);
  console.log(`Users:    ${initialUserCount} -> ${finalUserCount}`);
  console.log(`Profiles: ${initialProfileCount} -> ${finalProfileCount}`);
  console.log(`Flagged:  ${initialFlaggedCount} -> ${finalFlaggedCount}`);
  console.log(`==================================================================\n`);
}

fixSharedMobileSiblings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
