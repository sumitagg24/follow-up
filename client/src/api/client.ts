const BASE = import.meta.env?.VITE_API_URL || "";

const TOKEN_KEY = "ffu_auth_token";

export function getStoredToken(): string | null {
  try {
    // Remember-me sessions live in localStorage; ephemeral sessions in sessionStorage.
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string, remember: boolean) {
  try {
    if (remember) localStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable — session lives in memory only */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

/** Fired when the API reports an expired/invalid session so the app can route to /login. */
export const onUnauthorized = (() => {
  const listeners = new Set<() => void>();
  return {
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    emit() {
      listeners.forEach((fn) => fn());
    },
  };
})();

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const url = BASE ? BASE.replace(/\/$/, "") + path : path;
  const token = getStoredToken();
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      onUnauthorized.emit();
    }
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const err = new Error(body.error || `Request failed ${res.status}`) as Error & { details?: string[]; status?: number };
    if (body.details) err.details = body.details;
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  // ---- auth ----
  register: (data: { name: string; email: string; password: string }) =>
    req<{ token: string; user: { id?: string; _id?: string; name: string; email: string } }>(`/api/auth/register`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    req<{ token: string; user: { id?: string; _id?: string; name: string; email: string } }>(`/api/auth/login`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: () => req<{ user: { name: string; email: string } }>(`/api/auth/me`),

  // ---- core resources ----
  getVentures: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return req<any[]>(`/api/ventures${q}`);
  },
  getVenture: (id: string) =>
    req<{ venture: any; followUp: any; tasks: any[]; activities: any[] }>(`/api/ventures/${id}`),
  createVenture: (data: any) => req<any>(`/api/ventures`, { method: "POST", body: JSON.stringify(data) }),
  updateVenture: (id: string, data: any) =>
    req<any>(`/api/ventures/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteVenture: (id: string) => req<any>(`/api/ventures/${id}`, { method: "DELETE" }),
  getDashboardStats: () => req<any>(`/api/dashboard/stats`),
  getDashboard: () =>
    req<{ stats: any; todaysFollowUps: any[]; overdueFollowUps: any[]; upcomingFollowUps: any[]; recentActivity: any[]; lastAutomationRun: any }>(`/api/dashboard`),
  getFollowUps: (status?: string) => req<any[]>(`/api/followups${status ? `?status=${status}` : ""}`),
  completeFollowUp: (id: string) => req<any>(`/api/followups/${id}/complete`, { method: "PUT" }),
  rescheduleFollowUp: (id: string, dueDate: string) =>
    req<any>(`/api/followups/${id}/reschedule`, { method: "PUT", body: JSON.stringify({ dueDate }) }),
  getTasks: (ventureId?: string) => req<any[]>(`/api/tasks${ventureId ? `?ventureId=${ventureId}` : ""}`),
  completeTask: (id: string) => req<any>(`/api/tasks/${id}/complete`, { method: "PUT" }),
  getActivity: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return req<any[]>(`/api/activity${q}`);
  },
  runAutomation: () => req<any>(`/api/automation/check-followups`, { method: "POST" }),
  getAnalytics: () =>
    req<{
      venturesByStatus: { _id: string; count: number }[];
      followUpOutcomes: { _id: string; count: number }[];
      taskStats: { _id: string; count: number }[];
      activityVolume: { date: string; count: number }[];
    }>(`/api/analytics`),
  getSystemStatus: () => req<any>(`/api/system`),
  seed: () => req<any>(`/api/seed`, { method: "POST" }),
};
