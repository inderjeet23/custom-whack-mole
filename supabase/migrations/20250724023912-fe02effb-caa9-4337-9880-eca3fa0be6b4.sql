-- Create leaderboard table for whack-a-mole game
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  game_duration INTEGER DEFAULT 60, -- in seconds
  CONSTRAINT score_positive CHECK (score >= 0),
  CONSTRAINT name_length CHECK (length(player_name) <= 50 AND length(player_name) > 0)
);

-- Enable Row Level Security
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies for leaderboard access
-- Anyone can view the leaderboard
CREATE POLICY "Leaderboard is publicly viewable" 
ON public.leaderboard 
FOR SELECT 
USING (true);

-- Anyone can insert their own score (for now - could be restricted later)
CREATE POLICY "Anyone can insert scores" 
ON public.leaderboard 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance when fetching top scores
CREATE INDEX idx_leaderboard_score_desc ON public.leaderboard (score DESC, created_at DESC);

-- Create index for fetching recent scores
CREATE INDEX idx_leaderboard_created_at ON public.leaderboard (created_at DESC);