import Navbar from "@/components/layout/Navbar";
import QuoteCard from "@/components/mindfulness/QuoteCard";
import MeditationCard from "@/components/mindfulness/MeditationCard";
import FunFactCard from "@/components/mindfulness/FunFactCard";

export default function Wellness() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50">
      <Navbar />
      <main className="container py-8">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Wellness</h1>
        <div className="grid gap-6 lg:grid-cols-2">
          <QuoteCard />
          <FunFactCard />
          <div className="lg:col-span-2">
            <MeditationCard />
          </div>
        </div>
      </main>
    </div>
  );
}
