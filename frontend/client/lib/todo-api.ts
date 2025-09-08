export type Priority = "Low" | "Medium" | "High";
export type Status = "Pending" | "Completed";

export interface Task {
  id: number;
  task: string;
  category: string;
  priority: Priority;
  deadline: string | null;
  status: Status;
  recurring: boolean;
  consistency_score?: number;
  last_completed?: string | null;
  created_at: string;
}

function getBaseUrl() {
  const env = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (env && env.trim().length > 0) return env.replace(/\/$/, "");
  return "";
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  const token = localStorage.getItem("jwt");
  const hasBody = !!init?.body;
  const headers: Record<string, any> = {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers || {}),
  };
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { ...init, headers });
  } catch (e: any) {
    throw new Error("Network error. Please check your connection or try again.");
  }
  if (!res.ok) {
    if (res.status === 401) {
      try { localStorage.removeItem("jwt"); } catch {}
      if (!location.pathname.startsWith("/login")) location.replace("/login");
    }
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export const TodoAPI = {
  // Tasks
  getTasks: () => http<Task[]>("/tasks"),
  addTask: (body: Partial<Task> & { task: string }) =>
    http<any>("/tasks", { method: "POST", body: JSON.stringify(body) }),
  updateTask: (id: number, body: Partial<Task>) =>
    http<{ message?: string }>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTask: (id: number) => http<{ message?: string }>(`/tasks/${id}`, { method: "DELETE" }),
  // Completion helper
  completeTask: (id: number) => http<{ message?: string }>(`/tasks/${id}/complete`, { method: "POST", body: JSON.stringify({}) }),

  // Analytics
  completionRate: () => http<{ completion_rate: number }>("/analytics/completion_rate"),
  byCategory: () => http<Record<string, number>>("/analytics/by_category"),
  byPriority: () => http<Record<string, number>>("/analytics/by_priority"),
  habits: async () => {
    try {
      const tasks = await TodoAPI.getTasks();
      return tasks
        .filter((t) => !!t.recurring)
        .map((t) => ({
          id: t.id,
          task: t.task,
          consistency_score: t.consistency_score ?? 0,
          last_completed: t.last_completed ?? null,
          status: t.status,
        }));
    } catch {
      return [] as {
        id: number;
        task: string;
        consistency_score: number;
        last_completed: string | null;
        status: Status;
      }[];
    }
  },
};

export type Quote = { quote: string; author?: string };
export const MindAPI = {
  getQuote: () => http<Quote>("/wellness/quote"),
  getFunFact: () => http<any>("/wellness/fact"),
};

export const AuthAPI = {
  me: () => http<any>("/me"),
  updateMe: (body: { name?: string }) => http<any>("/me", { method: "PATCH", body: JSON.stringify(body) }),
  changePassword: (body: { current_password: string; new_password: string; confirm_password: string }) =>
    http<any>("/change-password", { method: "POST", body: JSON.stringify(body) }),
  setPassword: (body: { new_password: string; confirm_password: string }) =>
    http<any>("/set-password", { method: "POST", body: JSON.stringify(body) }),
};
