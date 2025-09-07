import { MindAPI } from "@/lib/todo-api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function FunFactCard() {
  const enabled = typeof window !== "undefined" && !!localStorage.getItem("jwt");
  const query = useQuery({ queryKey: ["funfact"], queryFn: MindAPI.getFunFact, enabled });
  const fact = query.data?.fact || query.data?.text || "Connect a fun facts endpoint to display here.";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100/70 via-rose-100/60 to-fuchsia-100/60 p-5 shadow-md ring-1 ring-black/5 dark:from-amber-900/20 dark:via-rose-900/20 dark:to-fuchsia-900/20">
      <div className="mb-1 text-xs uppercase tracking-wider text-foreground/60">Fun Fact</div>
      <div className="text-balance text-lg font-medium leading-relaxed">{fact}</div>
      <div className="mt-4">
        <Button size="sm" variant="outline" onClick={() => query.refetch()} disabled={query.isRefetching}>
          {query.isRefetching ? "Refreshing..." : "New Fact"}
        </Button>
      </div>
    </motion.div>
  );
}
