const API_BASE = "http://localhost:5000/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request(method: string, path: string, body?: any) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }

  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request("POST", "/auth/login", { email, password }),
    register: (username: string, email: string, password: string) =>
      request("POST", "/auth/register", { username, email, password }),
    me: () => request("GET", "/auth/me"),
  },
  habits: {
    list: () => request("GET", "/habits"),
    create: (name: string, category?: string, color?: string, groupId?: string) =>
      request("POST", "/habits", { name, category, color, groupId }),
    update: (id: string, data: any) => request("PUT", `/habits/${id}`, data),
    delete: (id: string) => request("DELETE", `/habits/${id}`),
    reorder: (groupId: string, habitIds: string[]) =>
      request("PUT", `/habits/reorder/${groupId}`, { habitIds }),
  },
  habitGroups: {
    list: () => request("GET", "/habits/groups"),
    create: (name: string) => request("POST", "/habits/groups", { name }),
    update: (id: string, name: string) => request("PUT", `/habits/groups/${id}`, { name }),
    delete: (id: string) => request("DELETE", `/habits/groups/${id}`),
    reorder: (groupIds: string[]) =>
      request("PUT", "/habits/groups/reorder", { groupIds }),
  },
  completions: {
    list: (startDate?: string, endDate?: string) => {
      let path = "/completions";
      if (startDate && endDate) path += `?startDate=${startDate}&endDate=${endDate}`;
      return request("GET", path);
    },
    toggle: (date: string, habitId: string) =>
      request("POST", "/completions", { date, habitId }),
  },
  analytics: {
    overview: (year?: number, month?: number) => {
      let path = "/analytics/overview";
      const params: string[] = [];
      if (year !== undefined) params.push(`year=${year}`);
      if (month !== undefined) params.push(`month=${month}`);
      if (params.length) path += `?${params.join("&")}`;
      return request("GET", path);
    },
    habits: (year?: number, month?: number) => {
      let path = "/analytics/habits";
      const params: string[] = [];
      if (year !== undefined) params.push(`year=${year}`);
      if (month !== undefined) params.push(`month=${month}`);
      if (params.length) path += `?${params.join("&")}`;
      return request("GET", path);
    },
    weekly: (year?: number, month?: number) => {
      let path = "/analytics/weekly";
      const params: string[] = [];
      if (year !== undefined) params.push(`year=${year}`);
      if (month !== undefined) params.push(`month=${month}`);
      if (params.length) path += `?${params.join("&")}`;
      return request("GET", path);
    },
    trends: (year?: number, month?: number) => {
      let path = "/analytics/trends";
      const params: string[] = [];
      if (year !== undefined) params.push(`year=${year}`);
      if (month !== undefined) params.push(`month=${month}`);
      if (params.length) path += `?${params.join("&")}`;
      return request("GET", path);
    },
    longestStreak: (year?: number, month?: number) => {
      let path = "/analytics/longest-streak";
      const params: string[] = [];
      if (year !== undefined) params.push(`year=${year}`);
      if (month !== undefined) params.push(`month=${month}`);
      if (params.length) path += `?${params.join("&")}`;
      return request("GET", path);
    },
  },
};
