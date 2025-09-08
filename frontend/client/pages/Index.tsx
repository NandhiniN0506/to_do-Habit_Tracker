import Navbar from "@/components/layout/Navbar";
import TaskForm from "@/components/todo/TaskForm";
import TaskList from "@/components/todo/TaskList";
import GamificationBar from "@/components/gamification/GamificationBar";
import WelcomeOverlay from "@/components/onboarding/WelcomeOverlay";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50">
      <Navbar />
      <WelcomeOverlay />
      <main className="container py-8">
        <GamificationBar />
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Your prioritized tasks</h1>
          <p className="text-muted-foreground">Sorted automatically by priority, urgency, and habit consistency.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <TaskForm />
          </div>
          <div className="lg:col-span-2">
            <TaskList />
          </div>
        </div>
      </main>
    </div>
  );
}
