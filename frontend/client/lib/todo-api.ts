// lib/todo-api.ts
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

// ---------------- Base URL ----------------
function getBaseUrl() {
  return "https://to-do-habit-tracker.onrender.com"; // your live backend
}

// ---------------- HTTP helper ----------------
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

// ---------------- Todo API ----------------
export const TodoAPI = {
  getTasks: () => http<Task[]>("/tasks"),
  addTask: (body: Partial<Task> & { task: string }) =>
    http<Task>("/tasks", { method: "POST", body: JSON.stringify(body) }),
  updateTask: (id: number, body: Partial<Task>) =>
    http<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTask: (id: number) => http<{ message?: string }>(`/tasks/${id}`, { method: "DELETE" }),
  completeTask: (id: number) => TodoAPI.updateTask(id, { status: "Completed" }),

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

// ---------------- Mindfulness API ----------------
export type Quote = { quote: string; author?: string };

export const MindAPI = {
  getQuote: () => http<Quote>("/wellness/quote"),
  getFunFact: () => http<any>("/wellness/fact"),
};
