-- Add due_date column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN due_date DATE;

-- Create index for faster date queries
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Create index for user_id and due_date combination
CREATE INDEX idx_tasks_user_due_date ON public.tasks(user_id, due_date);