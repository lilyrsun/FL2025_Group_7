# Spontaneous Events Quick Start Guide

## What Was Implemented

A complete "Spontaneous Events" feature that allows users to share their real-time location with friends for spontaneous hangouts.

## Files Added/Modified

### Backend
- ✅ `sidequests/backend/routes/spontaneous.js` - New route file with 5 endpoints
- ✅ `sidequests/backend/index.js` - Added spontaneous routes and auto-expiry logic
- ✅ `sidequests/supabase/migrations/enable_spontaneous_realtime.sql` - Migration for realtime support

### Frontend
- ✅ `sidequests/components/SpontaneousBottomSheet.tsx` - UI for starting/stopping sharing
- ✅ `sidequests/hooks/useSpontaneous.ts` - Custom hook for managing presences and realtime
- ✅ `sidequests/app/(main)/home.tsx` - Integrated spontaneous presences into home screen
- ✅ `sidequests/components/EventBottomSheet.tsx` - Updated to show spontaneous presences

## Setup Instructions

### 1. Database Setup (Already Done)
The `spontaneous_presences` table already exists in your Supabase database.

### 2. Enable Realtime
Run this migration to enable realtime for the table:
```bash
cd sidequests
supabase db push
```

Or manually run the SQL from `sidequests/supabase/migrations/enable_spontaneous_realtime.sql`

### 3. Start Backend
```bash
cd sidequests/backend
npm run dev
```

The backend now includes:
- `/spontaneous/*` endpoints
- Auto-expiry task (runs every 5 minutes)

### 4. Start Frontend
```bash
cd sidequests
yarn start
```

## How to Use

### As a User Starting a Spontaneous Event
1. Open the home screen
2. Tap the "Start Spontaneous" button at the bottom
3. Enter an optional status (e.g., "Down for coffee!")
4. Tap "Start Sharing"
5. Your location is now visible to friends for 10 minutes
6. Location updates automatically as you move

### As a Friend Viewing Spontaneous Events
1. Open the home screen
2. Friends sharing their location appear as profile picture markers on the map
3. Green circle indicates they're actively sharing
4. Bottom sheet → "Spontaneous" tab shows all friends sharing
5. Real-time updates when friends start/stop sharing

### Stopping a Spontaneous Event
- Tap the "Start Spontaneous" button again (it shows "Sharing..." when active)
- Or open the spontaneous sheet and tap "Stop Sharing"

## Key Features

### Real-Time Updates
- Friends see your location update as you move
- Start/stop events propagate instantly to all friends
- Powered by Supabase Realtime

### Privacy
- Only friends can see your location
- Presence auto-expires after 10 minutes
- You can stop sharing at any time
- No historical location data stored

### Location Tracking
- Updates every 30 seconds or when you move 50 meters
- Uses balanced GPS accuracy for battery efficiency
- Only works when app is in foreground

## API Endpoints

- `POST /spontaneous/start` - Start or update presence
- `POST /spontaneous/update-location` - Update location
- `POST /spontaneous/stop` - Stop sharing
- `GET /spontaneous/nearby` - Get nearby friends sharing
- `GET /spontaneous/me/:user_id` - Get your own active presence

## Testing the Feature

### Prerequisites
- Two users with accepted friendship
- Both users logged in

### Test Flow
1. User A: Tap "Start Spontaneous" and share location
2. User B: Should see User A's profile marker on the map
3. User A: Move around (location updates automatically)
4. User B: Should see marker move in real-time
5. User A: Tap "Stop Sharing"
6. User B: Marker disappears instantly
7. Wait 10+ minutes and verify auto-expiry

## Troubleshooting

**Friends not seeing my location:**
- Verify friendship is accepted in `friendships` table
- Check `spontaneous_presences.is_active` is `true`
- Verify `expires_at` is in the future

**Real-time updates not working:**
- Ensure Supabase Realtime is enabled for the table
- Check WebSocket connection in browser console
- Verify backend is running

**Location not updating:**
- Grant location permission
- Ensure GPS is enabled
- Keep app in foreground

## Next Steps

1. Test with multiple friends
2. Try the 10-minute auto-expiry
3. Test starting/stopping multiple times
4. Verify real-time updates work
5. Check location tracking on actual device movement

## Documentation

For detailed documentation, see `sidequests/SPONTANEOUS_EVENTS.md`

