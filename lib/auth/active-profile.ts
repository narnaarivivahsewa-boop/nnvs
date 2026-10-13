import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Extracts the requested active profile ID from cookies or session
 */
export function getActiveProfileId(
  req: NextRequest,
  sessionProfileId?: string
): string | null {
  const cookieProfileId =
    req.cookies.get("activeProfileId")?.value ||
    req.cookies.get("nnvs_active_profile_id")?.value;

  const headerProfileId = req.headers.get("x-active-profile-id");

  return cookieProfileId || headerProfileId || sessionProfileId || null;
}

/**
 * Loads the active profile for a user based on activeProfileId cookie/session,
 * falling back gracefully to the most recent profile owned by the user.
 */
export async function getActiveProfileForUser<T = any>(
  req: NextRequest,
  userId: string,
  sessionProfileId?: string,
  queryOptions?: any
): Promise<T | null> {
  const preferredId = getActiveProfileId(req, sessionProfileId);

  if (preferredId) {
    const profile = await prisma.profile.findFirst({
      where: {
        userId,
        OR: [{ id: preferredId }, { profileId: preferredId }],
      },
      ...queryOptions,
    });

    if (profile) return profile as unknown as T;
  }

  // Fallback to most recent profile for user
  const fallback = await prisma.profile.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    ...queryOptions,
  });

  return (fallback as unknown as T) || null;
}
