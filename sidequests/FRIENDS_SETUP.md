# Friends Functionality Setup Guide

## Database Setup

You need to run these SQL queries in your local Supabase database to create the required tables for the friends functionality.

### 1. Update Users Table
Run this first to add the profile_picture column:

```sql
-- Add profile_picture column to users table if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_picture text;

-- Update any existing users to have default profile pictures
UPDATE public.users 
SET profile_picture = 'https://via.placeholder.com/150' 
WHERE profile_picture IS NULL;
```

### 2. Create Friendships Table
Run this to create the friendships table:

```sql
-- Create friendships table for friend management system
CREATE TABLE public.friendships (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id_1 uuid NOT NULL,
  user_id_2 uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT friendships_pkey PRIMARY KEY (id),
  CONSTRAINT friendships_user_id_1_fkey FOREIGN KEY (user_id_1) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT friendships_user_id_2_fkey FOREIGN KEY (user_id_2) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT friendships_unique_pair UNIQUE (user_id_1, user_id_2)
);

-- Create indexes for better performance
CREATE INDEX friendships_user_id_1_idx ON public.friendships(user_id_1);
CREATE INDEX friendships_user_id_2_idx ON public.friendships(user_id_2);
CREATE INDEX friendships_status_idx ON public.friendships(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## How to Run These Queries

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste each SQL block above
4. Run them in order (users table update first, then friendships table creation)

## Navigation Fix

The friends page now properly navigates back to the profile page instead of the home page.

## Testing

After running the SQL queries:

1. **Test User Lookup**: Try sending a friend request to `serenahuang225@gmail.com` - it should now find the user
2. **Test Friends List**: The friends and requests tabs should now load without the "table not found" error
3. **Test Navigation**: The back button on the friends page should take you back to the profile page

## Features Available

- ✅ Send friend requests by email
- ✅ Accept/reject friend requests  
- ✅ View friends list
- ✅ Remove friends
- ✅ Friends count and preview on profile page
- ✅ Instagram-like UI with tabs

## Troubleshooting

If you still get "User not found" errors:
1. Check that the user actually exists in your `users` table
2. Verify the email address is exactly correct (case-sensitive)
3. Check the backend console logs for detailed error information

If you get table errors:
1. Make sure you ran both SQL scripts above
2. Check that the `friendships` table was created successfully
3. Restart your backend server after creating the table
