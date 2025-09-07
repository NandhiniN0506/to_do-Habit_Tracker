import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export default function MeditationCard() {
  const [duration, setDuration] = useState(3); // minutes
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(duration * 60);
  const controls = useAnimationControls();

  useEffect(() => setRemaining(duration * 60), [duration]);

  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    const loop = async () => {
      while (true) {
        await controls.start({ scale: 1.1, transition: { duration: 3, ease: "easeInOut" } });
        await controls.start({ scale: 0.9, transition: { duration: 3, ease: "easeInOut" } });
      }
    };
    loop();
    return () => clearInterval(i);
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && running) {
      setRunning(false);
      import("@/lib/local-stats").then(({ LocalStats }) => {
        LocalStats.addMeditationSession(duration);
      }).catch(() => {});
    }
  }, [remaining, running, duration]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(Math.floor(remaining % 60)).padStart(2, "0");

  return (
    <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-sky-50 p-5 shadow-md ring-1 ring-black/5 dark:from-slate-900/40 dark:to-slate-800/40">
      <div className="mb-3 text-sm font-medium text-foreground/70">Meditation</div>
      <div className="grid items-center gap-5 sm:grid-cols-2">
        <div className="flex items-center justify-center">
          <motion.div animate={controls} className="aspect-square w-48 rounded-full bg-cyan-200/60 shadow-inner dark:bg-cyan-500/20" />
        </div>
        <div className="space-y-4">
          <div className="text-4xl font-semibold tracking-tight">{mm}:{ss}</div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 3, 5].map((m) => (
              <Button key={m} variant={duration === m ? "default" : "outline"} onClick={() => setDuration(m)}>
                {m}m
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="number" min={1} className="h-10 w-24 rounded-md border px-3 text-sm" value={duration} onChange={(e) => setDuration(Math.max(1, Number(e.target.value || 1)))} />
            <span className="text-sm text-muted-foreground">min</span>
          </div>
          <div className="flex gap-2">
            {!running ? (
              <Button className="flex-1" onClick={() => setRunning(true)}>Play</Button>
            ) : (
              <Button variant="outline" className="flex-1" onClick={() => setRunning(false)}>Pause</Button>
            )}
            <Button variant="ghost" onClick={() => { setRunning(false); setRemaining(duration * 60); }}>Reset</Button>
          </div>
          <p className="text-sm text-muted-foreground">Breathe in as the circle expands, out as it contracts.</p>
        </div>
      </div>
    </div>
  );
}
