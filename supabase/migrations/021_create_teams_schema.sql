-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    created_by uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (team_id, user_id)
);

-- Add team_id to captures table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'captures' AND column_name = 'team_id') THEN
        ALTER TABLE public.captures ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Helper function to get my team IDs (Security Definer to bypass RLS recursion if needed, though strictly strictly user_id filter is enough)
CREATE OR REPLACE FUNCTION public.get_my_team_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid();
$$;

-- Policies for teams

-- View: I can see teams I am a member of
CREATE POLICY "View teams I am a member of" ON public.teams
    FOR SELECT USING (
        id IN (SELECT public.get_my_team_ids())
    );

-- Create: Authenticated users can create teams
CREATE POLICY "Create teams" ON public.teams
    FOR INSERT WITH CHECK (
        auth.uid() = created_by
    );

-- Update: Only owners/admins (simple check: created_by for now) can update
CREATE POLICY "Update teams if owner" ON public.teams
    FOR UPDATE USING (
        auth.uid() = created_by
    );

-- Policies for team_members

-- View: I can see members of teams I belong to
CREATE POLICY "View members of my teams" ON public.team_members
    FOR SELECT USING (
        team_id IN (SELECT public.get_my_team_ids())
    );

-- Policies for captures (Team Access)
-- Note: This is additive to existing "View own captures" policy
CREATE POLICY "View team captures" ON public.captures
    FOR SELECT USING (
        team_id IN (SELECT public.get_my_team_ids())
    );

-- Trigger to auto-add creator as team owner
CREATE OR REPLACE FUNCTION public.auto_add_team_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner');
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_team_created
    AFTER INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_add_team_creator();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_captures_team_id ON public.captures(team_id);
