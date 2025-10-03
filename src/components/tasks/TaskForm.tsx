import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mic, MicOff, CalendarIcon } from "lucide-react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskFormProps {
  onTaskAdded: () => void;
}

export const TaskForm = ({ onTaskAdded }: TaskFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [voiceField, setVoiceField] = useState<'name' | 'description' | null>(null);
  const { toast } = useToast();
  const { isListening, transcript, error, startListening, stopListening, resetTranscript } = useVoiceInput();

  useEffect(() => {
    if (transcript && voiceField) {
      if (voiceField === 'name') {
        setName(transcript);
      } else if (voiceField === 'description') {
        setDescription(transcript);
      }
      resetTranscript();
      setVoiceField(null);
    }
  }, [transcript, voiceField, resetTranscript]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Voice input error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create tasks",
          variant: "destructive",
        });
        return;
      }

      const { data: newTask, error } = await supabase.from("tasks").insert({
        user_id: user.id,
        name,
        description,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
      }).select().single();

      if (error) throw error;

      // Call edge function to prioritize the task
      if (newTask && description) {
        try {
          await supabase.functions.invoke('prioritize-task', {
            body: { taskId: newTask.id, description }
          });
        } catch (priorityError: any) {
          console.error('Priority error:', priorityError);
          // Don't fail the whole operation if prioritization fails
        }
      }

      toast({ title: "Task created successfully!" });
    setName("");
    setDescription("");
    setDueDate(undefined);
    onTaskAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = (field: 'name' | 'description') => {
    if (isListening) {
      stopListening();
    } else {
      setVoiceField(field);
      startListening();
    }
  };

  return (
    <Card className="shadow-md border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Task
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Task Name</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                placeholder="Enter task name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant={isListening && voiceField === 'name' ? "destructive" : "outline"}
                size="icon"
                onClick={() => handleVoiceInput('name')}
                disabled={isListening && voiceField !== 'name'}
              >
                {isListening && voiceField === 'name' ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <div className="flex gap-2">
              <Textarea
                id="description"
                placeholder="Enter task description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex-1"
              />
              <Button
                type="button"
                variant={isListening && voiceField === 'description' ? "destructive" : "outline"}
                size="icon"
                onClick={() => handleVoiceInput('description')}
                disabled={isListening && voiceField !== 'description'}
                className="self-start"
              >
                {isListening && voiceField === 'description' ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="dueDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
