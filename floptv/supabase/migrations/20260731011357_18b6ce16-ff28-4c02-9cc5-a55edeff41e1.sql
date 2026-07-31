ALTER TABLE public.stream_config
  ADD COLUMN IF NOT EXISTS paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pause_message text NOT NULL DEFAULT 'Já voltamos!',
  ADD COLUMN IF NOT EXISTS interlude_video_id text,
  ADD COLUMN IF NOT EXISTS interlude_started_at timestamptz;

CREATE TABLE public.playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  youtube_video_id text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.playlist_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlist_items TO authenticated;
GRANT ALL ON public.playlist_items TO service_role;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Playlist is public" ON public.playlist_items FOR SELECT USING (true);
CREATE POLICY "Admins manage playlist" ON public.playlist_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.schedule_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL DEFAULT CURRENT_DATE,
  start_time time NOT NULL DEFAULT '20:00',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schedule_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_items TO authenticated;
GRANT ALL ON public.schedule_items TO service_role;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schedule is public" ON public.schedule_items FOR SELECT USING (true);
CREATE POLICY "Admins manage schedule" ON public.schedule_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_playlist_items_updated_at BEFORE UPDATE ON public.playlist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schedule_items_updated_at BEFORE UPDATE ON public.schedule_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_items;