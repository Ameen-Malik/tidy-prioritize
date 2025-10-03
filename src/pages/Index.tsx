import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskList } from "@/components/tasks/TaskList";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VoiceAssistant } from "@/components/tasks/VoiceAssistant";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTasks, setRefreshTasks] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
  };

  const handleTaskAdded = () => {
    setRefreshTasks((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border/50 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">TaskPrioritizer</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(), "EEEE, MMMM d")}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/calendar">
                <Button variant="ghost" size="sm">
                  <CalendarIcon className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Calendar</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-6xl">
        <TaskForm onTaskAdded={handleTaskAdded} />
        
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Today's Tasks</h2>
          <TaskList refresh={refreshTasks} todayOnly />
        </div>
      </main>

      <VoiceAssistant onTaskCreated={handleTaskAdded} />
    </div>
  );
};

export default Index;
