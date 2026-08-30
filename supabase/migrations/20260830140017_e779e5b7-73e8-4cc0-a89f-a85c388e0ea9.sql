CREATE TABLE public.studio_scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  name TEXT NOT NULL DEFAULT 'Untitled scene',
  thumbnail TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_scenes TO authenticated;
GRANT ALL ON public.studio_scenes TO service_role;

ALTER TABLE public.studio_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scenes"
  ON public.studio_scenes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX studio_scenes_user_updated_idx ON public.studio_scenes (user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_studio_scenes_updated_at
  BEFORE UPDATE ON public.studio_scenes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();