-- Create pomodoro_sessions table for recording timer data
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.todos(id) ON DELETE SET NULL,
  task_title TEXT,
  duration_seconds BIGINT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_created_at ON public.pomodoro_sessions(created_at);

-- Enable RLS
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own pomodoro sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can view their own pomodoro sessions"
  ON public.pomodoro_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own pomodoro sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can create their own pomodoro sessions"
  ON public.pomodoro_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own pomodoro sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can delete their own pomodoro sessions"
  ON public.pomodoro_sessions FOR DELETE
  USING (auth.uid() = user_id);
