import { Preferences } from "@capacitor/preferences";

const AUTH_TOKEN_KEY = "nnvs_auth_token";
const ACTIVE_PROFILE_KEY = "nnvs_active_profile_id";
const USER_DATA_KEY = "nnvs_user_data";

function stripOversizedDataUrls(value: any): any {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map(stripOversizedDataUrls);
  }

  const profileRef =
    typeof value.profileId === "string" && value.profileId
      ? value.profileId
      : typeof value.id === "string" && value.id
      ? value.id
      : null;

  const cloned: Record<string, any> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === "string" && raw.startsWith("data:") && raw.length > 2048) {
      cloned[key] =
        profileRef && (key === "photo" || key === "imageUrl")
          ? `/api/profiles/${encodeURIComponent(profileRef)}/photo`
          : null;
    } else if (raw && typeof raw === "object") {
      cloned[key] = stripOversizedDataUrls(raw);
    } else {
      cloned[key] = raw;
    }
  }
  return cloned;
}

/**
 * Persists session credentials across Web, Android, and iOS.
 * Uses Capacitor Preferences (native SharedPreferences on Android, UserDefaults on iOS)
 * with a fallback to localStorage in standard web browsers.
 */
export async function saveAuthSession(
  token: string,
  activeProfileId?: string | null,
  userData?: any
): Promise<void> {
  try {
    if (token) {
      await Preferences.set({ key: AUTH_TOKEN_KEY, value: token });
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(AUTH_TOKEN_KEY, token);
        } catch {}
      }
    }

    if (activeProfileId) {
      await Preferences.set({ key: ACTIVE_PROFILE_KEY, value: activeProfileId });
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
          // Set client-accessible active profile cookie (90 days)
          const secureFlag =
            window.location.protocol === "https:" ? "; Secure" : "";
          document.cookie = `activeProfileId=${encodeURIComponent(
            activeProfileId
          )}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax${secureFlag}`;
        } catch {}
      }
    }

    if (userData) {
      const sanitizedData =
        typeof userData === "string"
          ? userData
          : stripOversizedDataUrls(userData);
      const serialized =
        typeof sanitizedData === "string"
          ? sanitizedData
          : JSON.stringify(sanitizedData);
      await Preferences.set({ key: USER_DATA_KEY, value: serialized });
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(USER_DATA_KEY, serialized);
        } catch {}
      }
    }
  } catch (err) {
    console.warn("Could not save native auth session preferences:", err);
  }
}

/**
 * Retrieves the stored auth session from native Preferences or localStorage.
 */
export async function getAuthSession(): Promise<{
  token: string | null;
  activeProfileId: string | null;
  userData: any | null;
}> {
  let token: string | null = null;
  let activeProfileId: string | null = null;
  let userData: any | null = null;

  try {
    const tokenRes = await Preferences.get({ key: AUTH_TOKEN_KEY });
    token = tokenRes.value;

    const profileRes = await Preferences.get({ key: ACTIVE_PROFILE_KEY });
    activeProfileId = profileRes.value;

    const userRes = await Preferences.get({ key: USER_DATA_KEY });
    if (userRes.value) {
      try {
        userData = JSON.parse(userRes.value);
      } catch {
        userData = userRes.value;
      }
    }
  } catch (err) {
    console.warn("Could not read native auth session preferences:", err);
  }

  // Web fallback if Capacitor Preferences returned nothing
  if (!token && typeof window !== "undefined") {
    try {
      token = localStorage.getItem(AUTH_TOKEN_KEY);
      activeProfileId = activeProfileId || localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (!userData) {
        const rawUser = localStorage.getItem(USER_DATA_KEY);
        if (rawUser) {
          try {
            userData = JSON.parse(rawUser);
          } catch {
            userData = rawUser;
          }
        }
      }
    } catch {}
  }

  return { token, activeProfileId, userData };
}

/**
 * Completely clears stored credentials on logout.
 */
export async function clearAuthSession(): Promise<void> {
  try {
    await Preferences.remove({ key: AUTH_TOKEN_KEY });
    await Preferences.remove({ key: ACTIVE_PROFILE_KEY });
    await Preferences.remove({ key: USER_DATA_KEY });
  } catch {}

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      document.cookie =
        "activeProfileId=; path=/; max-age=0; SameSite=Lax";
    } catch {}
  }
}

/**
 * Fetches `/api/auth/me` using cookies first and falling back cleanly to the
 * stored Bearer token from Capacitor Preferences / localStorage if cookies are
 * absent or stale. Re-hydrates cookies automatically when fallback succeeds.
 */
export async function fetchAuthMeWithFallback(
  timeoutMs: number = 10000
): Promise<{
  res: Response;
  data: any;
}> {
  const fetchWithController = async (headers?: Record<string, string>) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };

  let res = await fetchWithController();
  let data: any = {};

  if (!res.ok && (res.status === 401 || res.status === 403 || res.status === 404)) {
    const { token } = await getAuthSession();
    if (token) {
      res = await fetchWithController({
        Authorization: `Bearer ${token}`,
      });
    }
  }

  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (res.ok && data?.success && data?.user) {
    if (data.token) {
      await saveAuthSession(
        data.token,
        data.user.activeProfile?.id || data.user.profile?.id || null,
        data.user
      );
    }
  } else if (res.status === 401 || res.status === 403 || res.status === 404) {
    await clearAuthSession();
  }

  return { res, data };
}

/**
 * Re-hydrates server cookies from native persistent storage if cookies were dropped.
 * Call this on app bootstrap or in navigation layouts.
 */
export async function syncSessionToCookies(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const { token, activeProfileId } = await getAuthSession();
    if (!token) return false;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      // Ping /api/auth/me with Authorization header to verify and re-hydrate cookies if needed
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.token) {
          await saveAuthSession(
            data.token,
            data.user?.activeProfile?.id || activeProfileId,
            data.user
          );
          return true;
        }
      } else if (res.status === 401 || res.status === 403 || res.status === 404) {
        // Token is truly expired, invalid, or user deleted
        await clearAuthSession();
        return false;
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.warn("Error syncing persistent session to cookies:", err);
  }
  return false;
}
