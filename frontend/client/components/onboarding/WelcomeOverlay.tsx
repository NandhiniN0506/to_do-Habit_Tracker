import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TodoAPI } from "@/lib/todo-api";

const VIDEO = {
  cat_hi: "/cat_hi.mp4",
  cool_cat: "/cool_cat.mp4",
  boy_flying: "/animation_boy_flying.mp4",
  girl_work_life: "/girl_work_life.mp4",
  boy_motivation: "/boy_motivation.mp4",
  girl_motivation: "/girl_motivation.mp4",
} as const;

export default function WelcomeOverlay() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"new" | "returning">("returning");
  const [pending, setPending] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<"male" | "female">("male");

  const name =
    (typeof window !== "undefined" && localStorage.getItem("user_name")) || null;
  const isMale = gender === "male";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const m = sessionStorage.getItem("onboarding_mode") as any;
    if (m === "new" || m === "returning") {
      setMode(m);
      setOpen(true);
    }

    // fetch gender from localStorage or backend
    const g = localStorage.getItem("user_gender");
    if (g) {
      setGender(g.toLowerCase() === "female" ? "female" : "male");
    } else {
      const email = localStorage.getItem("user_email");
      const token = localStorage.getItem("jwt");
      if (email && token) {
        fetch(
          `https://to-do-habit-tracker.onrender.com/gender?email=${email}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
          .then((res) => res.json())
          .then((data) => {
            if (data?.gender) {
              const normalized =
                data.gender.toLowerCase() === "female" ? "female" : "male";
              setGender(normalized);
              localStorage.setItem("user_gender", normalized); // cache for next time
            }
          })
          .catch(() => setGender("male"));
      }
    }
  }, []);

  useEffect(() => {
    if (!open || mode !== "returning") return;
    TodoAPI.getTasks()
      .then((tasks) => {
        const count = tasks.filter((t) => t.status !== "Completed").length;
        setPending(count);
      })
      .catch(() => setPending(null));
  }, [open, mode]);

  if (!open) return null;

  type Page = { src: string; title: string; body?: string };
  const pages: Page[] =
    mode === "new"
      ? [
          {
            src: VIDEO.cat_hi,
            title: `Hiii${name ? ", " + name.split(" ")[0] : "!"}`,
            body: "I'm your buddy. Let's build habits together!",
          },
          {
            src: VIDEO.cool_cat,
            title: "Start small",
            body: "Add one habit today. I'll keep you motivated.",
          },
          {
            src: isMale ? VIDEO.boy_flying : VIDEO.girl_work_life,
            title: "Good luck!",
            body: "You've got this — let's go!",
          },
        ]
      : [
          {
            src: VIDEO.cool_cat,
            title:
              pending == null
                ? "Welcome back!"
                : `${pending} task${pending === 1 ? "" : "s"} pending`,
            body:
              pending == null
                ? "Let's plan your day."
                : "I'll help you focus on what matters.",
          },
          {
            src: isMale ? VIDEO.boy_motivation : VIDEO.girl_motivation,
            title: "Good luck!",
            body: "Let's crush those tasks!",
          },
        ];

  const last = step >= pages.length - 1;

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.removeItem("onboarding_mode");
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative h-64 w-64 overflow-hidden rounded-2xl">
            <video
              src={pages[step].src}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              {pages[step].title}
            </h2>
            {pages[step].body ? (
              <p className="text-muted-foreground">{pages[step].body}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {pages.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex w-full items-center justify-between pt-2">
            <Button variant="ghost" onClick={close}>
              Skip
            </Button>
            <Button
              onClick={() =>
                last
                  ? close()
                  : setStep((s) => Math.min(s + 1, pages.length - 1))
              }
            >
              {last ? "Let's go" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
