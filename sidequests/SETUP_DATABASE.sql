-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  profile_picture text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  date date NOT NULL,
  type text CHECK (type = ANY (ARRAY['RSVP'::text, 'Spontaneous'::text])),
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  latitude NUMERIC(18, 10) NOT NULL,
  longitude NUMERIC(18, 10) NOT NULL,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- EVENT IMAGES
CREATE TABLE IF NOT EXISTS public.event_images (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_id uuid,
  image_url text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_images_pkey PRIMARY KEY (id),
  CONSTRAINT event_images_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);

-- FRIENDSHIPS
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id_1 uuid NOT NULL,
  user_id_2 uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT friendships_pkey PRIMARY KEY (id),
  CONSTRAINT friendships_user_id_1_fkey FOREIGN KEY (user_id_1) REFERENCES public.users(id),
  CONSTRAINT friendships_user_id_2_fkey FOREIGN KEY (user_id_2) REFERENCES public.users(id)
);

-- SPONTANEOUS PRESENCES
CREATE TABLE IF NOT EXISTS public.spontaneous_presences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  status_text text,
  latitude NUMERIC(18, 10) NOT NULL,
  longitude NUMERIC(18, 10) NOT NULL,
  accuracy integer,
  is_active boolean NOT NULL DEFAULT true,
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '10 minutes'),
  visibility text NOT NULL DEFAULT 'friends'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT spontaneous_presences_pkey PRIMARY KEY (id),
  CONSTRAINT spontaneous_presences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- SPONTANEOUS PRESENCE PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.spontaneous_presence_participants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  presence_id uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['coming'::text, 'there'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT spontaneous_presence_participants_pkey PRIMARY KEY (id),
  CONSTRAINT spontaneous_presence_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT spontaneous_presence_participants_presence_id_fkey FOREIGN KEY (presence_id) REFERENCES public.spontaneous_presences(id)
);

-- EVENT RSVPS
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'none'::text CHECK (status = ANY (ARRAY['yes'::text, 'no'::text, 'none'::text])),
  CONSTRAINT event_rsvps_pkey PRIMARY KEY (id),
  CONSTRAINT event_rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT event_rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);

-- EVENT RSVP INVITEES (for restricting who can see/RSVP to events)
CREATE TABLE IF NOT EXISTS public.event_rsvp_invitees (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_rsvp_invitees_pkey PRIMARY KEY (id),
  CONSTRAINT event_rsvp_invitees_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT event_rsvp_invitees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude NUMERIC(18, 10) NOT NULL,
  longitude NUMERIC(18, 10) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reflection TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);