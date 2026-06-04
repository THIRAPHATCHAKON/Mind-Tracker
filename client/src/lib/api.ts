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
    create: (name: string, category?: string, color?: string) =>
      request("POST", "/habits", { name, category, color }),
    update: (id: string, data: any) => request("PUT", `/habits/${id}`, data),
    delete: (id: string) => request("DELETE", `/habits/${id}`),
  },
  tasks: {
    list: () => request("GET", "/tasks"),
    create: (name: string, category?: string, color?: string) =>
      request("POST", "/tasks", { name, category, color }),
    update: (id: string, data: any) => request("PUT", `/tasks/${id}`, data),
    delete: (id: string) => request("DELETE", `/tasks/${id}`),
  },
  completions: {
    list: (startDate?: string, endDate?: string) => {
      let path = "/completions";
      if (startDate && endDate) path += `?startDate=${startDate}&endDate=${endDate}`;
      return request("GET", path);
    },
    toggle: (date: string, habitId?: string, taskId?: string) =>
      request("POST", "/completions", { date, habitId: habitId || null, taskId: taskId || null }),
  },
  analytics: {
    overview: () => request("GET", "/analytics/overview"),
    habits: () => request("GET", "/analytics/habits"),
    weekly: () => request("GET", "/analytics/weekly"),
  },
};
