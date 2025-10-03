import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskCard } from "./TaskCard";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  name: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  priority: string | null;
  priority_reasoning: string | null;
  due_date: string | null;
}

interface TaskListProps {
  refresh: number;
  todayOnly?: boolean;
  date?: Date;
}

export const TaskList = ({ refresh, todayOnly = false, date }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByPriority, setSortByPriority] = useState(false);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from("tasks")
        .select("*");

      if (todayOnly) {
        const today = format(new Date(), 'yyyy-MM-dd');
        query = query.or(`due_date.eq.${today},due_date.is.null`).eq("completed", false);
      } else if (date) {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.eq("due_date", dateStr);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      setTasks(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading tasks",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refresh, todayOnly, date]);

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const handleSort = () => {
    setSortByPriority(!sortByPriority);
  };

  const sortedTasks = sortByPriority
    ? [...tasks].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        return bPriority - aPriority;
      })
    : tasks;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tasks yet. Create your first task above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSort}
          className="gap-2"
        >
          <ArrowUpDown className="w-4 h-4" />
          <span className="hidden sm:inline">{sortByPriority ? "Sort by Date" : "Sort by Priority"}</span>
          <span className="sm:hidden">Sort</span>
        </Button>
      </div>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {sortedTasks.map((task) => (
          <TaskCard key={task.id} task={task} onTaskUpdated={fetchTasks} />
        ))}
      </div>
    </div>
  );
};
