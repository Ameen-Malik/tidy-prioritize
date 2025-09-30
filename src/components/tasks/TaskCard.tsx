import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  name: string;
  description: string | null;
  completed: boolean;
}

interface TaskCardProps {
  task: Task;
  onTaskUpdated: () => void;
}

export const TaskCard = ({ task, onTaskUpdated }: TaskCardProps) => {
  const { toast } = useToast();

  const handleToggleComplete = async (checked: boolean) => {
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
  };

  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="mt-1"
          />
          <div className="flex-1 space-y-1">
            <h3
              className={`font-medium ${
                task.completed ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              {task.name}
            </h3>
            {task.description && (
              <p
                className={`text-sm ${
                  task.completed ? "line-through text-muted-foreground" : "text-muted-foreground"
                }`}
              >
                {task.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
