-- ============================================================
-- Step 1: Create threads table
-- ============================================================
CREATE TABLE threads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_2              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  initiated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  origin_checkin_id   UUID REFERENCES checkins(id)   ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlocked_at         TIMESTAMPTZ,
  latest_message_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unread_count_user_1 INT NOT NULL DEFAULT 0,
  unread_count_user_2 INT NOT NULL DEFAULT 0,
  CONSTRAINT threads_user_pair_unique UNIQUE  (user_1, user_2),
  CONSTRAINT threads_user_order_check CHECK   (user_1 < user_2)
);

ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "threads: members can read own threads" ON threads
  FOR SELECT USING (auth.uid() = user_1 OR auth.uid() = user_2);

CREATE POLICY "threads: initiator can insert" ON threads
  FOR INSERT WITH CHECK (auth.uid() = initiated_by);

CREATE POLICY "threads: members can update" ON threads
  FOR UPDATE USING (auth.uid() = user_1 OR auth.uid() = user_2);

-- ============================================================
-- Step 2: Add new columns to messages
-- ============================================================
ALTER TABLE messages
  ADD COLUMN thread_id     UUID REFERENCES threads(id) ON DELETE CASCADE,
  ADD COLUMN body          TEXT,
  ADD COLUMN message_type  TEXT CHECK (message_type IN ('intro', 'reply')) DEFAULT 'intro';

-- ============================================================
-- Step 3: Migrate existing messages into threads
-- Pick the earliest message per user pair as thread creator
-- ============================================================
WITH ranked AS (
  SELECT
    LEAST(sender_id, receiver_id)    AS u1,
    GREATEST(sender_id, receiver_id) AS u2,
    sender_id,
    checkin_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
      ORDER BY created_at ASC
    ) AS rn
  FROM messages
  WHERE sender_id IS DISTINCT FROM receiver_id
    AND sender_id  IS NOT NULL
    AND receiver_id IS NOT NULL
)
INSERT INTO threads (user_1, user_2, initiated_by, origin_checkin_id, created_at, latest_message_at)
SELECT u1, u2, sender_id, checkin_id, created_at, created_at
FROM ranked
WHERE rn = 1
ON CONFLICT (user_1, user_2) DO NOTHING;

-- ============================================================
-- Step 4: Backfill thread_id, body, message_type
-- ============================================================
UPDATE messages m
SET
  thread_id    = t.id,
  body         = m.text,
  message_type = 'intro'
FROM threads t
WHERE LEAST(m.sender_id, m.receiver_id)    = t.user_1
  AND GREATEST(m.sender_id, m.receiver_id) = t.user_2;

-- ============================================================
-- Step 5: Enforce NOT NULL now that backfill is complete
-- ============================================================
ALTER TABLE messages
  ALTER COLUMN thread_id    SET NOT NULL,
  ALTER COLUMN body         SET NOT NULL,
  ALTER COLUMN message_type SET NOT NULL;

-- ============================================================
-- Step 6: Drop old columns (cascade handles any dependent constraints)
-- ============================================================
ALTER TABLE messages
  DROP COLUMN IF EXISTS receiver_id,
  DROP COLUMN IF EXISTS checkin_id,
  DROP COLUMN IF EXISTS sender_name,
  DROP COLUMN IF EXISTS sender_status,
  DROP COLUMN IF EXISTS text;

-- ============================================================
-- Step 7: Update messages RLS
-- Drop old policies (try common names used in Spottr)
-- ============================================================
DROP POLICY IF EXISTS "Users can insert messages"        ON messages;
DROP POLICY IF EXISTS "Users can read their messages"    ON messages;
DROP POLICY IF EXISTS "Enable insert for authenticated"  ON messages;
DROP POLICY IF EXISTS "Enable select for authenticated"  ON messages;

CREATE POLICY "messages: thread members can read" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = messages.thread_id
        AND (threads.user_1 = auth.uid() OR threads.user_2 = auth.uid())
    )
  );

CREATE POLICY "messages: sender can insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = messages.thread_id
        AND (threads.user_1 = auth.uid() OR threads.user_2 = auth.uid())
    )
  );

-- ============================================================
-- Step 8: Trigger — maintain thread metadata on message insert
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE threads SET
    latest_message_at   = NOW(),
    unlocked_at         = CASE
                            WHEN NEW.message_type = 'reply' AND unlocked_at IS NULL THEN NOW()
                            ELSE unlocked_at
                          END,
    unread_count_user_1 = CASE
                            WHEN user_1 != NEW.sender_id THEN unread_count_user_1 + 1
                            ELSE unread_count_user_1
                          END,
    unread_count_user_2 = CASE
                            WHEN user_2 != NEW.sender_id THEN unread_count_user_2 + 1
                            ELSE unread_count_user_2
                          END
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_insert
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION handle_new_message();
