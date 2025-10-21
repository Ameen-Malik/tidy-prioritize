import { memo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  name: string;
  description: string | null;
  completed: boolean;
  priority: string | null;
  priority_reasoning: string | null;
}

interface TaskCardProps {
  task: Task;
  onTaskUpdated: () => void;
}

// Move outside component to avoid recreation on every render
const getPriorityColor = (priority: string | null) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500/10 text-red-700 border-red-300';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-300';
    case 'low':
      return 'bg-green-500/10 text-green-700 border-green-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const TaskCardComponent = ({ task, onTaskUpdated }: TaskCardProps) => {
  const { toast } = useToast();

  const handleToggleComplete = useCallback(async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: checked })
        .eq("id", task.id);

      if (error) throw error;

      toast({
        title: checked ? "Task completed!" : "Task marked as incomplete",
      });
      
      onTaskUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [task.id, toast, onTaskUpdated]);

  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="mt-1 flex-shrink-0"
          />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={`font-medium text-sm sm:text-base break-words ${
                  task.completed ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {task.name}
              </h3>
              {task.priority && (
                <Badge variant="outline" className={`${getPriorityColor(task.priority)} flex-shrink-0 text-xs`}>
                  {task.priority}
                </Badge>
              )}
            </div>
            {task.description && (
              <p
                className={`text-xs sm:text-sm break-words ${
                  task.completed ? "line-through text-muted-foreground" : "text-muted-foreground"
                }`}
              >
                {task.description}
              </p>
            )}
            {task.priority_reasoning && (
              <p className="text-xs text-muted-foreground italic break-words">
                {task.priority_reasoning}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Wrap with memo to prevent unnecessary re-renders when props haven't changed
export const TaskCard = memo(TaskCardComponent);
