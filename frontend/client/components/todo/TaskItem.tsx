import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TodoAPI, Task, Priority } from "@/lib/todo-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function TaskItem({ task: t }: { task: Task }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState({
    task: t.task,
    category: t.category,
    priority: t.priority as Priority,
    deadline: t.deadline as string | null,
  });

  // Pomodoro local state
  const [session, setSession] = useState<{ id: number; start: number; duration: number } | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    if (!session) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [session]);
  const remaining = useMemo(() => {
    if (!session) return 0;
    const end = session.start + session.duration * 60 * 1000;
    return Math.max(0, end - now);
  }, [session, now]);
  const mmss = useMemo(() => {
    const total = Math.floor(remaining / 1000);
    const m = Math.floor(total / 60).toString().padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [remaining]);

  const update = useMutation({
    mutationFn: (patch: Partial<Task>) => TodoAPI.updateTask(t.id, patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      if (prev) {
        qc.setQueryData<Task[]>(["tasks"], prev.map((it) => (it.id === t.id ? { ...it, ...patch } : it)));
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  const del = useMutation({
    mutationFn: () => TodoAPI.deleteTask(t.id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      if (prev) qc.setQueryData<Task[]>(["tasks"], prev.filter((it) => it.id !== t.id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const completeTask = useMutation({
    mutationFn: () => TodoAPI.completeTask(t.id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      if (prev) {
        // Remove the task immediately so it vanishes from the Pending list
        qc.setQueryData<Task[]>(["tasks"], prev.filter((it) => it.id !== t.id));
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  // Local-only Pomodoro controls
  const startPomodoro = (duration: number) => {
    setSession({ id: Date.now(), start: Date.now(), duration });
  };
  const completePomodoro = async () => {
    setSession(null);
    try {
      const { LocalStats } = await import("@/lib/local-stats");
      LocalStats.addPomodoro(1);
    } catch {}
  };

  const save = () => {
    update.mutate({ ...local });
    setEditing(false);
  };

  return (
    <div className="group rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Checkbox checked={t.status === "Completed"} onCheckedChange={() => completeTask.mutate()} />
          <div>
            {!editing ? (
              <>
                <h3 className={(t.status === "Completed" ? "text-muted-foreground " : "") + "font-medium leading-tight line-clamp-2"}>{t.task}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{t.category}</Badge>
                  <Badge className={
                    t.priority === "High" ? "bg-red-500/15 text-red-600" : t.priority === "Medium" ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600"
                  }>
                    {t.priority}
                  </Badge>
                  {t.deadline ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> {t.deadline}
                    </span>
                  ) : null}
                  {t.recurring ? (
                    <span className="inline-flex items-center gap-1">• Consistency {t.consistency_score}%</span>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="grid gap-3">
                <Input value={local.task} onChange={(e) => setLocal((s) => ({ ...s, task: e.target.value }))} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input value={local.category} onChange={(e) => setLocal((s) => ({ ...s, category: e.target.value }))} />
                  <Select value={local.priority} onValueChange={(v) => setLocal((s) => ({ ...s, priority: v as Priority }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" value={local.deadline ?? ""} onChange={(e) => setLocal((s) => ({ ...s, deadline: e.target.value || null }))} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
          {!editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
              {t.status !== "Completed" && (
                <Button size="sm" onClick={() => completeTask.mutate()} disabled={completeTask.isPending}>Complete</Button>
              )}
            </>
          ) : (
            <>
              <Button size="sm" onClick={save} disabled={update.isPending}>Save</Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          )}
          <Button variant="destructive" size="icon" onClick={() => del.mutate()} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Pomodoro controls */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {!session ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => startPomodoro(25)}>Start Pomodoro (25m)</Button>
            <Button variant="ghost" size="sm" onClick={() => startPomodoro(15)}>Quick 15m</Button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-secondary px-2 py-1 text-sm font-mono">{mmss}</span>
            <Button size="sm" onClick={() => completePomodoro()} disabled={remaining > 0}>Mark Pomodoro Complete</Button>
          </div>
        )}
      </div>

      {t.status === "Completed" ? <Separator className="mt-3" /> : null}
    </div>
  );
}
