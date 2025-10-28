-- Enable Realtime for spontaneous_presences table
ALTER PUBLICATION supabase_realtime ADD TABLE spontaneous_presences;

-- Create function to automatically expire spontaneous presences
CREATE OR REPLACE FUNCTION expire_spontaneous_presences()
RETURNS void AS $$
BEGIN
  UPDATE spontaneous_presences
  SET is_active = false
  WHERE is_active = true
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a simple scheduled job using pg_cron (if available)
-- Note: This requires the pg_cron extension to be enabled
-- If pg_cron is not available, you can run this function periodically via backend
-- SELECT cron.schedule('expire-spontaneous-presences', '*/1 * * * *', 'SELECT expire_spontaneous_presences();');

-- Run the expiry function immediately when the migration runs
SELECT expire_spontaneous_presences();

