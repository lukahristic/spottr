-- Fix push notification trigger body format.
-- The edge function reads payload.record but the trigger was sending the row
-- directly as the body. Wrap it in { record: ... } to match what the function expects.
CREATE OR REPLACE FUNCTION public.notify_new_message_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://hamymmbirdyubsbdcbzw.supabase.co/functions/v1/notify-new-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbXltbWJpcmR5dWJzYmRjYnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTQ1OTgsImV4cCI6MjA5NDU3MDU5OH0.dZ0N4P79jCy12Plllnpsl6HUMUgxPPa0uxxPubslxgs'
    ),
    body := jsonb_build_object('record', row_to_json(NEW)::jsonb)
  );
  RETURN NEW;
END;
$$;
