import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TodoAPI } from "@/lib/todo-api";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BarChart, XAxis, YAxis, CartesianGrid, Bar } from "recharts";

export default function Analytics() {
  const enabled = typeof window !== "undefined" && !!localStorage.getItem("jwt");
  const { data: completion } = useQuery({ queryKey: ["completion"], queryFn: TodoAPI.completionRate, enabled });
  const { data: byCategory } = useQuery({ queryKey: ["byCategory"], queryFn: TodoAPI.byCategory, enabled });
  const { data: habits } = useQuery({ queryKey: ["habits"], queryFn: TodoAPI.habits, enabled });

  const [localStats, setLocalStats] = useState({ pomo: 0, med: { sessions: 0, minutes: 0 } });
  useEffect(() => {
    import("@/lib/local-stats").then(({ LocalStats }) => {
      setLocalStats({ pomo: LocalStats.getPomodoros(), med: LocalStats.getMeditation() });
    }).catch(() => {});
  }, []);

  const categoryData = Object.entries(byCategory || {}).map(([k, v]) => ({ name: k, value: v }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50">
      <Navbar />
      <main className="container py-8 flex flex-col items-center gap-8">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight text-center">Analytics</h1>

        {/* Top Stats */}
        <div className="mb-6 grid gap-6 md:grid-cols-3 w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Pomodoros Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-cyan-600 text-center">{localStats.pomo}</div>
              <p className="text-sm text-muted-foreground text-center">Tracked locally</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Meditation Minutes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-indigo-600 text-center">{localStats.med.minutes}</div>
              <p className="text-sm text-muted-foreground text-center">Across {localStats.med.sessions} sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-center">{Math.round(completion?.completion_rate ?? 0)}%</div>
              <p className="text-sm text-muted-foreground text-center">Percentage of tasks marked as completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks by Category */}
        <div className="flex flex-col items-center w-full max-w-4xl gap-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Tasks by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <BarChart data={categoryData} width={600} height={300}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <Bar dataKey="value" fill="url(#barGradient)" radius={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Habits */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Habits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 justify-items-center">
                {(habits || []).map((h) => (
                  <div key={h.id} className="rounded-xl border p-4 text-center">
                    <div className="font-medium">{h.task}</div>
                    <div className="text-sm text-muted-foreground">Consistency {h.consistency_score}%</div>
                    {h.last_completed && (
                      <div className="text-xs text-muted-foreground">Last completed: {h.last_completed}</div>
                    )}
                  </div>
                ))}
                {(habits || []).length === 0 && (
                  <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
                    No recurring tasks yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
