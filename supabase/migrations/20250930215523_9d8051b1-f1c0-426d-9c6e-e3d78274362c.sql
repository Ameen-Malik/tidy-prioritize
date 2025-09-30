-- Add priority and priority_reasoning columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN priority_reasoning text;