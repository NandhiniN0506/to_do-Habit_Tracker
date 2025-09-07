import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TodoAPI, Priority } from "@/lib/todo-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function TaskForm() {
  const qc = useQueryClient();
  const [task, setTask] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [deadline, setDeadline] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);

  const addMutation = useMutation({
    mutationFn: () =>
      TodoAPI.addTask({ task, category, priority, deadline, recurring, status: "Pending" }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<any>(["tasks"]);
      const tempId = Date.now();
      const optimistic = [
        ...(prev || []),
        {
          id: tempId,
          task,
          category,
          priority,
          deadline,
          recurring,
          status: "Pending",
          consistency_score: 0,
          last_completed: null,
          created_at: new Date().toISOString(),
        },
      ];
      qc.setQueryData(["tasks"], optimistic);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
    },
    onSettled: async () => {
      setTask("");
      setCategory("General");
      setPriority("Medium");
      setDeadline(null);
      setRecurring(false);
      await qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return (
    <form
      className="grid gap-4 rounded-xl border bg-card p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!task.trim()) return;
        addMutation.mutate();
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="task">Task</Label>
        <Input id="task" placeholder="e.g. Write weekly report" value={task} onChange={(e) => setTask(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Category</Label>
          <Input placeholder="General" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={deadline ?? ""}
            onChange={(e) => setDeadline(e.target.value || null)}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label className="text-sm">Recurring</Label>
            <p className="text-xs text-muted-foreground">Track habit consistency</p>
          </div>
          <Switch checked={recurring} onCheckedChange={setRecurring} />
        </div>
      </div>
      <Button type="submit" disabled={addMutation.isPending}>
        {addMutation.isPending ? "Adding..." : "Add Task"}
      </Button>
    </form>
  );
}
