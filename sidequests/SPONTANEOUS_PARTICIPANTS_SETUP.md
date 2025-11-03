# Spontaneous Presence Participants Database Setup

## Database Table

Run this SQL in your Supabase database to create the table for tracking who's coming or there for spontaneous events:

```sql
-- Create spontaneous_presence_participants table
CREATE TABLE IF NOT EXISTS public.spontaneous_presence_participants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  presence_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('coming', 'there')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT spontaneous_presence_participants_pkey PRIMARY KEY (id),
  CONSTRAINT spontaneous_presence_participants_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT spontaneous_presence_participants_presence_id_fkey 
    FOREIGN KEY (presence_id) REFERENCES public.spontaneous_presences(id) ON DELETE CASCADE,
  CONSTRAINT spontaneous_presence_participants_unique_pair 
    UNIQUE (user_id, presence_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS spontaneous_presence_participants_user_id_idx 
  ON public.spontaneous_presence_participants(user_id);
CREATE INDEX IF NOT EXISTS spontaneous_presence_participants_presence_id_idx 
  ON public.spontaneous_presence_participants(presence_id);
CREATE INDEX IF NOT EXISTS spontaneous_presence_participants_status_idx 
  ON public.spontaneous_presence_participants(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_spontaneous_presence_participants_updated_at'
  ) THEN
    CREATE TRIGGER update_spontaneous_presence_participants_updated_at 
      BEFORE UPDATE ON public.spontaneous_presence_participants 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
```

## Table Schema

- `id`: Unique identifier (UUID)
- `user_id`: Reference to the user participating
- `presence_id`: Reference to the spontaneous presence
- `status`: Either "coming" or "there"
- `created_at`: When the participation was first created
- `updated_at`: When the status was last updated
- Unique constraint on (user_id, presence_id) to prevent duplicates

