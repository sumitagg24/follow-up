const BASE = (import.meta as any).env?.VITE_API_URL || "";

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    ...(opts.body && typeof opts.body !== "string" ? {} : {}),
  });
  if (!res.ok) {
    const body = await res.json().catch(()=>({ error: res.statusText }));
    throw new Error(body.error || `Request failed ${res.status}`);
  }
  return res.json();
}

export const api = {
  getVentures: (params?: Record<string,string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return req<any[]>(`/api/ventures${q}`);
  },
  getVenture: (id:string) => req<{venture:any,followUp:any,tasks:any[],activities:any[]}>(`/api/ventures/${id}`),
  createVenture: (data:any) => req<any>(`/api/ventures`, { method:"POST", body: JSON.stringify(data)}),
  updateVenture: (id:string,data:any) => req<any>(`/api/ventures/${id}`, { method:"PUT", body: JSON.stringify(data)}),
  deleteVenture: (id:string) => req<any>(`/api/ventures/${id}`, { method:"DELETE"}),
  getDashboardStats: () => req<any>(`/api/dashboard/stats`),
  getDashboard: () => req<{stats:any,todaysFollowUps:any[],overdueFollowUps:any[],upcomingFollowUps:any[],recentActivity:any[],lastAutomationRun:any}>(`/api/dashboard`),
  getFollowUps: (status?: string) => req<any[]>(`/api/followups${status?`?status=${status}`:""}`),
  completeFollowUp: (id:string) => req<any>(`/api/followups/${id}/complete`, { method:"PUT"}),
  rescheduleFollowUp: (id:string,dueDate:string) => req<any>(`/api/followups/${id}/reschedule`, { method:"PUT", body: JSON.stringify({dueDate})}),
  getTasks: (ventureId?:string) => req<any[]>(`/api/tasks${ventureId?`?ventureId=${ventureId}`:""}`),
  completeTask: (id:string) => req<any>(`/api/tasks/${id}/complete`, { method:"PUT"}),
  getActivity: (params?: Record<string,string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return req<any[]>(`/api/activity${q}`);
  },
  runAutomation: () => req<any>(`/api/automation/check-followups`, { method:"POST"}),
  getAnalytics: () => req<{
    venturesByStatus: {_id:string,count:number}[];
    followUpOutcomes: {_id:string,count:number}[];
    taskStats: {_id:string,count:number}[];
    activityVolume: {date:string,count:number}[];
  }>(`/api/analytics`),
  getSystemStatus: () => req<any>(`/api/system`),
  seed: () => req<any>(`/api/seed`, { method:"POST"}),
};
