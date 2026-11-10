export const DEFAULT_API_TIMEOUT_MS = 8000;

export class FetchTimeoutError extends Error {
  public readonly timeoutMs: number;

  constructor(
    timeoutMs: number = DEFAULT_API_TIMEOUT_MS,
    message?: string
  ) {
    super(
      message ||
        `Request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please check your connection and try again.`
    );
    this.name = "FetchTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export function isFetchTimeoutError(error: unknown): error is FetchTimeoutError {
  return error instanceof FetchTimeoutError;
}

export function isAbortError(error: unknown): boolean {
  if (isFetchTimeoutError(error)) return false;
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export function getFriendlyFetchErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (isFetchTimeoutError(error)) {
    return error.message;
  }
  return fallbackMessage;
}

export async function safeParseJson<T = Record<string, any>>(
  res: Response
): Promise<Partial<T>> {
  try {
    const data = await res.json();
    return data && typeof data === "object" ? (data as Partial<T>) : {};
  } catch {
    return {};
  }
}

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Wrapper around fetch() that enforces an explicit AbortController timeout
 * (default 8000ms) and guarantees timer cleanup inside finally.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const {
    timeoutMs = DEFAULT_API_TIMEOUT_MS,
    signal: externalSignal,
    ...fetchInit
  } = options;

  const controller = new AbortController();
  let didTimeout = false;

  const onExternalAbort = () => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...fetchInit,
      signal: controller.signal,
    });
  } catch (error) {
    if (didTimeout) {
      throw new FetchTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
}

