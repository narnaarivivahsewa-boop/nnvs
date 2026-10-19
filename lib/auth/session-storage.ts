import { Preferences } from "@capacitor/preferences";

const AUTH_TOKEN_KEY = "nnvs_auth_token";
const ACTIVE_PROFILE_KEY = "nnvs_active_profile_id";
const USER_DATA_KEY = "nnvs_user_data";

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
          document.cookie = `activeProfileId=${encodeURIComponent(activeProfileId)}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
        } catch {}
      }
    }

    if (userData) {
      const serialized = typeof userData === "string" ? userData : JSON.stringify(userData);
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
    } catch {}
  }
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

    // Ping /api/auth/me with Authorization header to verify and re-hydrate cookies if needed
    const res = await fetch("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        await saveAuthSession(data.token, data.user?.activeProfile?.id || activeProfileId, data.user);
      }
      return true;
    } else if (res.status === 401) {
      // Token is truly expired or invalid
      await clearAuthSession();
      return false;
    }
  } catch (err) {
    console.warn("Error syncing persistent session to cookies:", err);
  }
  return false;
}
