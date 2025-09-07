import { useQuery } from "@tanstack/react-query";
import { TodoAPI } from "@/lib/todo-api";

export default function GamificationBar() {
  const enabled = typeof window !== "undefined" && !!localStorage.getItem("jwt");
  const { data: completion } = useQuery({ queryKey: ["completion"], queryFn: TodoAPI.completionRate, enabled });
  const { data: habits } = useQuery({ queryKey: ["habits"], queryFn: TodoAPI.habits, enabled });

  const completionPct = Math.min(1, Math.max(0, (completion?.completion_rate ?? 0) / 100));
  const avgConsistency = (habits?.length || 0)
    ? Math.round((habits!.reduce((s, h) => s + (h.consistency_score || 0), 0) / habits!.length))
    : 0;

  return (
    <div className="container">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-gradient-to-br from-cyan-50 to-indigo-50 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-white/70 px-4 py-2 shadow">
            <div className="text-xs text-muted-foreground">Completion</div>
            <div className="text-xl font-semibold">{Math.round((completion?.completion_rate ?? 0))}%</div>
          </div>
          <div className="rounded-lg bg-white/70 px-4 py-2 shadow">
            <div className="text-xs text-muted-foreground">Avg Consistency</div>
            <div className="text-xl font-semibold">{avgConsistency}%</div>
          </div>
        </div>
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ width: `${Math.round(completionPct * 100)}%` }} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">On track to 100% completion</div>
        </div>
      </div>
    </div>
  );
}
