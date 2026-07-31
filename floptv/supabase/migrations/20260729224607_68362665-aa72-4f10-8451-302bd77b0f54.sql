ALTER TABLE public.stream_config
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_mode boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS loop_stream boolean NOT NULL DEFAULT true;