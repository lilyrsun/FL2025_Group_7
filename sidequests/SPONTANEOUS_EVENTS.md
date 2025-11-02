# Spontaneous Events Feature Documentation

## Overview

The Spontaneous Events feature enables users to signal when they are available for a spontaneous hangout, sharing their real-time location with friends. Friends can see these live locations on the map and join the user in the moment.

## Architecture

### Database Schema

The feature uses a `spontaneous_presences` table (already created in Supabase) with the following columns:
- `id`: Unique identifier
- `user_id`: Reference to the user
- `status_text`: Optional status message (e.g., "Down for coffee!")
- `latitude`: Current latitude
- `longitude`: Current longitude
- `accuracy`: GPS accuracy
- `is_active`: Boolean indicating if presence is active
- `last_seen`: Timestamp of last location update
- `expires_at`: Timestamp when presence will expire (10 minutes)
- `visibility`: Privacy setting (currently "friends" only)
- `created_at`: Timestamp when presence was created

### Backend API

Located in `sidequests/backend/routes/spontaneous.js`:

#### Endpoints

1. **POST /spontaneous/start**
   - Start or update a spontaneous presence
   - Body: `{ user_id, status_text, latitude, longitude, accuracy }`
   - Returns: The created/updated presence object
   - Auto-expires after 10 minutes

2. **POST /spontaneous/update-location**
   - Update the user's location as they move
   - Body: `{ user_id, latitude, longitude, accuracy }`
   - Returns: Updated presence object

3. **POST /spontaneous/stop**
   - End the spontaneous event
   - Body: `{ user_id }`
   - Returns: Confirmation message

4. **GET /spontaneous/nearby**
   - List active spontaneous presences near a location
   - Query params: `user_id, latitude, longitude, radius_miles`
   - Returns: Array of nearby active presences (friends only)
   - Filters by friendship status and geographic distance

5. **GET /spontaneous/me/:user_id**
   - Get user's own active presence
   - Returns: The user's active presence or 404

### Frontend Components

#### 1. `SpontaneousBottomSheet.tsx`
- Bottom sheet UI for starting/stopping spontaneous events
- Handles status text input
- Manages location permission requests
- Shows active sharing status

#### 2. `useSpontaneous.ts` (Hook)
- Manages spontaneous presence state
- Handles realtime subscriptions via Supabase
- Provides location tracking functionality
- Auto-updates nearby presences when friends start/stop sharing

#### 3. Integration in `home.tsx`
- Displays spontaneous presence markers on the map
- Shows profile pictures for friends sharing their location
- "Start Spontaneous" button for quick access
- Real-time updates when friends start/stop sharing

#### 4. Enhanced `EventBottomSheet.tsx`
- Shows spontaneous presences in the bottom sheet
- Toggle between "Spontaneous" and "RSVP" modes
- Real-time updates for friends sharing their location

## User Experience Flow

### Starting a Spontaneous Event
1. User taps "Start Spontaneous" button on home screen
2. Bottom sheet opens with options
3. User can enter optional status text
4. App requests location permission (if not already granted)
5. Presence is created in database with 10-minute expiry
6. Location tracking starts (updates every 30 seconds or 50 meters)
7. Friends see the user's live location on the map

### Viewing Friends' Spontaneous Presences
1. Friends appear as profile picture markers on the map
2. Green circle indicates active status
3. Tapping the marker shows friend's name and status
4. Bottom sheet shows all active friends sharing location
5. Real-time updates when friends join/leave

### Stopping a Spontaneous Event
1. User taps "Stop Sharing" in the spontaneous button (when active)
2. Or manually stops from the bottom sheet
3. Presence is deactivated in database
4. Location tracking stops
5. Friends' maps update in real-time to remove the marker

## Privacy & Expiry

### Automatic Expiry
- Presences expire after 10 minutes from creation
- Backend runs an expiry check every 5 minutes
- Expired presences are automatically deactivated
- Users can manually stop sharing at any time

### Privacy
- Only friends can see spontaneous presences
- Visibility is enforced at the API level
- User's location is only shared while `is_active` is true
- Last known location is not preserved after stopping

## Realtime Updates

### Supabase Realtime
The feature uses Supabase Realtime to broadcast presence changes:

- **INSERT**: When a friend starts sharing, it appears on your map instantly
- **UPDATE**: When a friend moves, the marker updates automatically
- **DELETE**: When a friend stops sharing, the marker disappears

### Subscription Logic
```javascript
const channel = supabase
  .channel('spontaneous_presences')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'spontaneous_presences',
    filter: 'visibility=eq.friends',
  }, (payload) => {
    // Handle real-time updates
  })
```

## Location Tracking

### Tracking Strategy
- **Update Frequency**: Every 30 seconds OR when user moves 50 meters
- **Battery Optimization**: Uses `Accuracy.Balanced` for GPS
- **Foreground Only**: Requires foreground permission
- **Graceful Degradation**: Falls back if location permission denied

### Location Updates
Updates are sent to `/spontaneous/update-location` endpoint, which:
- Updates the presence record with new coordinates
- Updates `last_seen` timestamp
- Maintains active status
- Friends receive real-time updates via Supabase

## Security & Permissions

### Authentication
- All endpoints require a valid `user_id`
- User ID is validated against authenticated user
- Service role key is used for backend operations

### Friendship Verification
- Only friends can see each other's presences
- Backend verifies friendship status before returning presences
- Geographic filtering ensures only nearby presences are shown

### Location Privacy
- Location is only shared while actively sharing
- No historical location data is stored
- Presence auto-expires after 10 minutes
- User can stop sharing at any time

## Database Migrations

### Enabling Realtime
Run the migration to enable realtime for the table:
```bash
supabase db push
# or
psql < your_database < sidequests/supabase/migrations/enable_spontaneous_realtime.sql
```

This migration:
1. Enables Supabase Realtime publication for `spontaneous_presences`
2. Creates an expiry function to automatically deactivate expired presences
3. Sets up periodic expiry checks

## Testing

### Manual Testing Checklist
- [ ] Start a spontaneous event as User A
- [ ] Verify User B (friend) sees the marker on map
- [ ] Verify User C (not friend) does not see the marker
- [ ] Update location by moving
- [ ] Verify friends see updated location in real-time
- [ ] Stop sharing and verify marker disappears for friends
- [ ] Wait 10+ minutes and verify auto-expiry
- [ ] Test location permission denial
- [ ] Test with multiple friends sharing simultaneously

### Backend Testing
```bash
# Start the backend
cd sidequests/backend
npm run dev

# Test starting a presence
curl -X POST http://localhost:4000/spontaneous/start \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID","latitude":38.0,"longitude":-90.0}'

# Test getting nearby presences
curl "http://localhost:4000/spontaneous/nearby?user_id=USER_ID&latitude=38.0&longitude=-90.0&radius_miles=5"
```

## Known Limitations

1. **Foreground Only**: Location tracking requires app to be in foreground
2. **10-minute Expiry**: Presence automatically expires after 10 minutes
3. **Friends Only**: Only friends can see each other's presences
4. **GPS Accuracy**: Location accuracy depends on device GPS capabilities
5. **Battery Usage**: Continuous location tracking can drain battery

## Future Enhancements

1. **Background Location**: Allow sharing when app is in background
2. **Custom Expiry**: Let users choose how long to share (5 min to 2 hours)
3. **Group Spontaneous Events**: Start group sessions with multiple friends
4. **Location History**: Optional recent location history for friends
5. **Privacy Zones**: Allow users to set "private zones" where sharing is disabled

## API Reference

### Start Presence
```typescript
POST /spontaneous/start
Body: {
  user_id: string;
  status_text?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}
Response: SpontaneousPresence
```

### Update Location
```typescript
POST /spontaneous/update-location
Body: {
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}
Response: SpontaneousPresence
```

### Stop Presence
```typescript
POST /spontaneous/stop
Body: { user_id: string; }
Response: { message: string, data: SpontaneousPresence }
```

### Get Nearby
```typescript
GET /spontaneous/nearby?user_id=ID&latitude=38.0&longitude=-90.0&radius_miles=5
Response: SpontaneousPresence[]
```

## Troubleshooting

### Friends not seeing my location
- Verify friendship is accepted in database
- Check that `is_active` is `true`
- Verify `expires_at` is in the future
- Check network connectivity

### Location not updating
- Verify location permission is granted
- Check GPS is enabled on device
- Ensure app is in foreground
- Check backend is running and accessible

### Real-time updates not working
- Verify Supabase Realtime is enabled
- Check subscription is active
- Verify WebSocket connection is established
- Check Supabase configuration

