import { Button } from "@/components/ui/button";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function MeditationCard() {
  const [duration, setDuration] = useState(3); // minutes
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(duration * 60);
  const [gender, setGender] = useState("male"); // default male
  const controls = useAnimationControls();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const runningRef = useRef(false);

  // Fetch gender from backend if not in localStorage
  useEffect(() => {
    const storedGender = localStorage.getItem("user_gender");
    if (storedGender) {
      setGender(storedGender.toLowerCase());
    } else {
      const email = localStorage.getItem("user_email");
      if (email) {
        fetch(`https://to-do-habit-tracker.onrender.com/gender?email=${email}`)
          .then(res => res.json())
          .then(data => setGender(data.gender === "female" ? "female" : "male"))
          .catch(() => setGender("male"));
      }
    }
  }, []);

  // Reset remaining when duration changes
  useEffect(() => setRemaining(duration * 60), [duration]);

  // Animation & timer
  useEffect(() => {
    let cancelled = false;
    let timer: any;

    if (running) {
      runningRef.current = true;
      timer = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);

      (async () => {
        while (!cancelled && runningRef.current) {
          await controls.start({ scale: 1.1, transition: { duration: 3, ease: "easeInOut" } });
          if (cancelled || !runningRef.current) break;
          await controls.start({ scale: 0.9, transition: { duration: 3, ease: "easeInOut" } });
        }
      })();
    } else {
      runningRef.current = false;
      controls.stop();
      controls.set({ scale: 1 });
    }

    return () => { cancelled = true; clearInterval(timer); runningRef.current = false; };
  }, [running]);

  // Play/pause video
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (running) v.play().catch(() => {});
    else v.pause();
  }, [running]);

  // End session
  useEffect(() => {
    if (remaining === 0 && running) {
      setRunning(false);
      import("@/lib/local-stats")
        .then(({ LocalStats }) => LocalStats.addMeditationSession(duration))
        .catch(() => {});
    }
  }, [remaining, running, duration]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(Math.floor(remaining % 60)).padStart(2, "0");

  // Video URLs
  const VIDEO = {
    boy: "/boy_meditation.mp4",
    girl: "/girl_meditation.mp4",
  };

  const videoSrc = gender === "female" ? VIDEO.girl : VIDEO.boy;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-sky-50 p-5 shadow-md ring-1 ring-black/5 dark:from-slate-900/40 dark:to-slate-800/40">
      <div className="mb-3 text-sm font-medium text-foreground/70">Meditation</div>
      <div className="grid items-center gap-5 sm:grid-cols-2">
        <div className="flex items-center justify-center">
          <motion.div animate={controls} className="relative aspect-square w-48 overflow-hidden rounded-full bg-cyan-200/60 shadow-inner dark:bg-cyan-500/20">
            <video
              ref={videoRef}
              src={videoSrc}
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          </motion.div>
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
            <Button variant="ghost" onClick={() => { setRunning(false); if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } setRemaining(duration * 60); }}>Reset</Button>
          </div>
          <p className="text-sm text-muted-foreground">Breathe in as the circle expands, out as it contracts.</p>
        </div>
      </div>
    </div>
  );
}
