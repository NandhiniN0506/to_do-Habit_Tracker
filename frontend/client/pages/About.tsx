import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, CheckCircle2, Flame, GaugeCircle, Heart, ListChecks, Mail, PieChart, Quote, Timer } from "lucide-react";

const features = [
  { icon: ListChecks, title: "Smart Tasks", desc: "Priority + urgency sorting, deadlines, categories, recurring habits." },
  { icon: Timer, title: "Pomodoro", desc: "Beautiful focus timer with pause, reset, stop and points rewards." },
  { icon: Brain, title: "Wellness", desc: "Motivation quotes, fun facts, and a calming meditation player." },
  { icon: PieChart, title: "Analytics", desc: "Colorful charts by priority/category, completion rate, and habits." },
  { icon: Flame, title: "Gamification", desc: "Points, streaks, and badges for tasks and pomodoros." },
  { icon: Mail, title: "Smart Reminders", desc: "Email reminders for overdue tasks." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50">
      <Navbar />
      <main className="container py-10">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <h1 className="text-4xl font-bold">About TaskFlow</h1>
          <p className="mt-2 text-muted-foreground">A cute, modern productivity app that blends focus, habits, and wellbeing.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><f.icon className="h-5 w-5 text-cyan-600" /> {f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
