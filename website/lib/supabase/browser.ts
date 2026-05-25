import { createClient } from "@supabase/supabase-js";

/*
 * Browser Supabase client — safe to use in client components ("use client").
 *
 * Uses the anon key, which is intentionally public. Security comes from RLS:
 * the `waitlist` table only allows INSERT for the anon role. Nobody can
 * SELECT, UPDATE, or DELETE rows from the browser.
 *
 * Created once at module level so React doesn't recreate it on every render.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
