import Navbar from "@/components/layout/Navbar";
import RingTimer from "@/components/pomodoro/RingTimer";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TodoAPI } from "@/lib/todo-api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Flame, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

export default function Pomodoro() {
  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: TodoAPI.getTasks,
  });

  const [taskId, setTaskId] = useState<number | null>(null);
  const [duration, setDuration] = useState(25);
  const [session, setSession] = useState<{ id: number; startedAt: number } | null>(null);
  const [remainingMs, setRemainingMs] = useState(duration * 60 * 1000);
  const [running, setRunning] = useState(false);

  useEffect(() => setRemainingMs(duration * 60 * 1000), [duration]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setRemainingMs(ms => Math.max(0, ms - 1000)), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const startSession = () => {
    if (!taskId) return;
    setSession({ id: taskId, startedAt: Date.now() });
    setRemainingMs(duration * 60 * 1000);
    setRunning(true);
  };

  const completeMutation = useMutation({
    mutationFn: async () => {
      const { LocalStats } = await import("@/lib/local-stats");
      LocalStats.addPomodoro(1);
    },
    onSuccess: () => {
      setRunning(false);
      setSession(null);
    },
  });

  useEffect(() => {
    if (running && remainingMs === 0) completeMutation.mutate();
  }, [running, remainingMs]);

  const stopSession = () => {
    setRunning(false);
    setSession(null);
    setRemainingMs(duration * 60 * 1000);
  };

  const resetTimer = () => {
    setRemainingMs(duration * 60 * 1000);
    setRunning(false);
  };

  const progress = Math.min(1, Math.max(0, 1 - remainingMs / (duration * 60 * 1000)));
  const mm = String(Math.floor(remainingMs / 1000 / 60)).padStart(2, "0");
  const ss = String(Math.floor((remainingMs / 1000) % 60)).padStart(2, "0");

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50">
      <Navbar />
      <main className="container py-8 flex flex-col gap-10">
        {/* Pomodoro Card */}
        <Card className="w-full max-w-3xl mx-auto flex flex-col gap-8">
          <CardHeader>
            <CardTitle>Focus Session</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {/* Timer */}
            <RingTimer progress={progress} size={350} stroke={18}>
              <div className="text-6xl font-bold">
                {mm}:{ss}
              </div>
            </RingTimer>

            {/* Task Selector */}
            <div className="w-full max-w-sm flex flex-col gap-4">
              <Label>Choose task</Label>
              <Select
                value={taskId?.toString() || ""}
                onValueChange={(v) => setTaskId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task to focus" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {(tasks || [])
                    .filter((t) => t.status !== "Completed")
                    .map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.task}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[25, 50, 5, 15].map((d) => (
                <Button
                  key={d}
                  variant={duration === d ? "default" : "outline"}
                  onClick={() => setDuration(d)}
                >
                  {d}m
                </Button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {!running && !session ? (
                <Button className="flex-1" onClick={startSession} disabled={!taskId}>
                  <Play className="mr-2 h-4 w-4" /> Start
                </Button>
              ) : (
                <>
                  {running ? (
                    <Button variant="outline" onClick={() => setRunning(false)}>
                      <Pause className="mr-2 h-4 w-4" /> Pause
                    </Button>
                  ) : (
                    <Button onClick={() => setRunning(true)}>
                      <Play className="mr-2 h-4 w-4" /> Resume
                    </Button>
                  )}
                  <Button variant="outline" onClick={resetTimer}>
                    Reset
                  </Button>
                  <Button variant="destructive" onClick={stopSession}>
                    Stop
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!session || remainingMs > 0 || completeMutation.isPending}
                    onClick={() => completeMutation.mutate()}
                  >
                    Mark Complete
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Flame className="h-5 w-5 text-amber-500" /> Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Pick a task, start a 25-minute session, then take a short break.
                Track completed sessions in local stats.
              </p>
              <p>Use the Analytics page to see your progress and habits.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
