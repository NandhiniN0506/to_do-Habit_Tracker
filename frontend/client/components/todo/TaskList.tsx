import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TodoAPI, Task, Priority, Status } from "@/lib/todo-api";
import TaskItem from "./TaskItem";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TaskList() {
  const { data: tasks } = useQuery({ queryKey: ["tasks"], queryFn: TodoAPI.getTasks });
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState<"All" | Priority>("All");
  const [status, setStatus] = useState<"All" | Status>("Pending");

  const filtered = useMemo(() => {
    const list = (tasks ?? []).filter((t) =>
      t.task.toLowerCase().includes(q.toLowerCase()) || t.category.toLowerCase().includes(q.toLowerCase()),
    );
    return list.filter((t) => (priority === "All" ? true : t.priority === priority)).filter((t) => (status === "All" ? true : t.status === status));
  }, [tasks, q, priority, status]);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input placeholder="Search tasks..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
          <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All priorities</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3">
        {filtered.map((t: Task) => (
          <TaskItem key={t.id} task={t} />
        ))}
        {filtered.length === 0 ? (
          <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">No tasks found</div>
        ) : null}
      </div>
    </div>
  );
}
