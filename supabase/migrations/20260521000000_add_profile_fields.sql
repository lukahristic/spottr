ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 100),
  ADD COLUMN IF NOT EXISTS avatar_style TEXT NOT NULL DEFAULT 'thumbs';
