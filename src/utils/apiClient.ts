/**
 * Centralized API client with automatic BYOK (Bring Your Own Key) header injection.
 * Ensures custom Gemini API Keys entered by external visitors or testers are attached
 * to all backend audit requests, preventing consumption of the host's quota.
 */

const STORAGE_BYOK_KEY = 'CUSTOM_GEMINI_KEY';

export function getCustomApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (
      localStorage.getItem(STORAGE_BYOK_KEY) ||
      sessionStorage.getItem(STORAGE_BYOK_KEY) ||
      ''
    ).trim();
  } catch {
    return '';
  }
}

export function setCustomApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  const clean = key.trim();
  if (clean) {
    localStorage.setItem(STORAGE_BYOK_KEY, clean);
    sessionStorage.setItem(STORAGE_BYOK_KEY, clean);
  } else {
    clearCustomApiKey();
  }
  // Dispatch custom event for real-time reactivity across components
  window.dispatchEvent(new Event('byok-key-updated'));
}

export function clearCustomApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_BYOK_KEY);
  sessionStorage.removeItem(STORAGE_BYOK_KEY);
  window.dispatchEvent(new Event('byok-key-updated'));
}

export function hasCustomApiKey(): boolean {
  return Boolean(getCustomApiKey());
}

/**
 * Enhanced fetch wrapper that attaches x-gemini-api-key if present
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const customKey = getCustomApiKey();
  const headers = new Headers(init?.headers || {});

  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (customKey) {
    headers.set('x-gemini-api-key', customKey);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
