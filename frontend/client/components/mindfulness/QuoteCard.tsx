import { MindAPI } from "@/lib/todo-api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function QuoteCard() {
  const enabled = typeof window !== "undefined" && !!localStorage.getItem("jwt");
  const query = useQuery({ queryKey: ["quote"], queryFn: MindAPI.getQuote, enabled });
  const [typed, setTyped] = useState("");
  const text = query.data?.quote || "Stay focused and keep shipping.";

  useEffect(() => {
    setTyped("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [text]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100/70 via-sky-100/70 to-violet-100/70 p-5 shadow-md ring-1 ring-black/5 dark:from-blue-900/30 dark:via-cyan-900/20 dark:to-indigo-900/30">
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/30 blur-2xl" />
      <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/30 blur-2xl" />
      <div className="relative">
        <div className="mb-1 text-xs uppercase tracking-wider text-foreground/60">Motivation</div>
        <div className="text-balance text-lg font-medium leading-relaxed">
          {typed}
          <span className="animate-pulse">▍</span>
        </div>
        {query.data?.author ? (
          <div className="mt-2 text-sm text-foreground/60">— {query.data.author}</div>
        ) : null}
        <div className="mt-4">
          <Button size="sm" variant="outline" onClick={() => query.refetch()} disabled={query.isRefetching}>
            {query.isRefetching ? "Refreshing..." : "New Quote"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
