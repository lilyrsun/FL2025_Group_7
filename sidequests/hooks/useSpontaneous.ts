import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BACKEND_API_URL } from '@env';
import * as Location from 'expo-location';
import { Event } from '../types/event';

export interface SpontaneousPresence {
  id: string;
  user_id: string;
  status_text: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  is_active: boolean;
  last_seen: string;
  expires_at: string;
  visibility: string;
  users?: {
    id: string;
    name: string;
    email: string;
    profile_picture?: string;
  };
}

export function useSpontaneous(userId: string | null, onEventsChange?: (event: Event, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) {
  const [presences, setPresences] = useState<SpontaneousPresence[]>([]);
  const [myPresence, setMyPresence] = useState<SpontaneousPresence | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState<Location.LocationSubscription | null>(null);

  // Get user's active presence on mount
  useEffect(() => {
    if (!userId) return;

    const fetchMyPresence = async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/spontaneous/me/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setMyPresence(data);
          setIsSharing(true);

          // Start location watcher
          startLocationTracking(data.id);
        }
      } catch (error) {
        console.error('Error fetching my presence:', error);
      }
    };

    fetchMyPresence();
  }, [userId]);

  // Start location tracking
  const startLocationTracking = async (presenceId: string) => {
    try {
      console.log('Starting location tracking for presence:', presenceId);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 50, // Or if they move 50 meters
        },
        async (location) => {
          if (!userId) return;

          try {
            await fetch(`${BACKEND_API_URL}/spontaneous/update-location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy ? Math.round(location.coords.accuracy) : 10,
              }),
            });
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }
      );

      setLocationWatcher(watcher);
      
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationWatcher) {
      locationWatcher.remove();
      setLocationWatcher(null);
    }
  };

  // Fetch nearby presences (for map display)
  const fetchNearbyPresences = useCallback(async (latitude: number, longitude: number, radiusMiles = 5) => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/spontaneous/nearby?user_id=${userId}&latitude=${latitude}&longitude=${longitude}&radius_miles=${radiusMiles}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched nearby presences:', data);
        setPresences(data);
      } else {
        console.error('Failed to fetch nearby presences:', response.status);
      }
    } catch (error) {
      console.error('Error fetching nearby presences:', error);
    }
  }, [userId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!userId) return;

    // Handler for both friends and public visibility
    const handlePresenceChange = (payload: any) => {
      console.log('Spontaneous presence change:', payload);

      // Handle INSERT, UPDATE, DELETE
      if (payload.eventType === 'INSERT') {
        // Handle current user's presence
        if (payload.new.user_id === userId) {
          setMyPresence(payload.new as SpontaneousPresence);
          setIsSharing(true);
          startLocationTracking(payload.new.id);
        } else {
          // For friend's or public presence, add it to the list if it's active
          // Only add if visibility matches (public or friends-only if we're friends)
          if (payload.new.is_active && payload.new.user_id !== userId) {
            const visibility = payload.new.visibility;
            
            // If visibility is 'friends', we need to check if they're actually friends
            // For now, rely on fetchNearbyPresences to do proper filtering
            // Only handle 'public' visibility in realtime, let backend filter friends
            if (visibility === 'public') {
              console.log('Public presence started sharing, adding to presences list:', payload.new);
              // Fetch full presence data with user info from backend
              fetch(`${BACKEND_API_URL}/spontaneous/me/${payload.new.user_id}`)
                .then(res => {
                  if (res.ok) {
                    return res.json();
                  }
                  if (res.status === 404) {
                    console.log('Presence not found (might have expired)');
                    return null;
                  }
                  throw new Error(`Failed to fetch: ${res.status}`);
                })
                .then(data => {
                  if (data && data.is_active && data.visibility === 'public') {
                    setPresences((prev) => {
                      // Only add if not already in list
                      if (!prev.find(p => p.id === data.id)) {
                        console.log('Adding public presence to list:', data);
                        return [...prev, data as SpontaneousPresence];
                      }
                      return prev;
                    });
                  }
                })
                .catch(err => console.error('Error fetching presence:', err));
            } else if (visibility === 'friends') {
              // For friends-only, don't add via realtime - let fetchNearbyPresences handle it
              // This ensures proper friendship checking
              console.log('Friends-only presence detected, will be added via fetchNearbyPresences');
            }
          }
        }
      } else if (payload.eventType === 'UPDATE') {
        // Handle current user's presence update
        if (payload.new.user_id === userId) {
          console.log('Current user presence updated:', payload.new);
          if (payload.new.is_active) {
            setMyPresence(payload.new as SpontaneousPresence);
            setIsSharing(true);
            console.log('Set isSharing to true');
          } else {
            setMyPresence(null);
            setIsSharing(false);
            stopLocationTracking();
            console.log('Set isSharing to false');
          }
        } else {
          // Update or remove based on is_active for other users
          if (payload.new.is_active && payload.new.user_id !== userId) {
            const visibility = payload.new.visibility;
            
            // Fetch full presence data with user info
            fetch(`${BACKEND_API_URL}/spontaneous/me/${payload.new.user_id}`)
              .then(res => {
                if (res.ok) {
                  return res.json();
                }
                return null;
              })
              .then(data => {
                if (data && data.is_active) {
                  setPresences((prev) => {
                    const existing = prev.find(p => p.id === data.id);
                    
                    // Only update/add if:
                    // 1. It's public visibility, OR
                    // 2. It's already in our list (meaning it passed friendship check via fetchNearbyPresences)
                    if (data.visibility === 'public' || existing) {
                      if (existing) {
                        // Update existing
                        return prev.map(p => p.id === data.id ? data as SpontaneousPresence : p);
                      } else if (data.visibility === 'public') {
                        // Add new public
                        return [...prev, data as SpontaneousPresence];
                      }
                    }
                    // If friends-only and not in list, don't add it
                    return prev;
                  });
                } else {
                  // Remove if not active
                  setPresences((prev) => prev.filter(p => p.id !== payload.old.id));
                }
              })
              .catch(err => {
                console.error('Error fetching updated presence:', err);
                // Fallback: only update if it's already in list
                setPresences((prev) => {
                  const existing = prev.find(p => p.id === payload.new.id);
                  if (payload.new.is_active && existing) {
                    return prev.map(p => p.id === payload.new.id ? payload.new as SpontaneousPresence : p);
                  }
                  return prev.filter(p => p.id !== payload.old.id);
                });
              });
          } else {
            // Remove if not active
            setPresences((prev) => prev.filter(p => p.id !== payload.old.id));
          }
        }
      } else if (payload.eventType === 'DELETE') {
        // Handle current user's presence deletion
        if (payload.old.user_id === userId) {
          setMyPresence(null);
          setIsSharing(false);
          stopLocationTracking();
        } else {
          setPresences((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      }
    };

    const channel = supabase
      .channel('spontaneous_presences')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spontaneous_presences',
          filter: `visibility=eq.friends`,
        },
        handlePresenceChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spontaneous_presences',
          filter: `visibility=eq.public`,
        },
        handlePresenceChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNearbyPresences]);

  // Subscribe to realtime changes for events
  useEffect(() => {
    if (!onEventsChange) return;

    const channel = supabase
      .channel('events_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        async (payload) => {
          console.log('Event change:', payload);

          // Handle INSERT, UPDATE, DELETE
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Fetch full event data with user info from backend
            try {
              const response = await fetch(`${BACKEND_API_URL}/events/${payload.new.id}`);
              if (response.ok) {
                const eventData = await response.json();
                onEventsChange(eventData as Event, payload.eventType);
              } else {
                // If individual fetch fails, use the payload data directly
                // But we need to ensure it has the users relation
                // For now, call the callback with the payload data
                onEventsChange(payload.new as Event, payload.eventType);
              }
            } catch (error) {
              console.error('Error fetching event details:', error);
              // Fallback to payload data
              onEventsChange(payload.new as Event, payload.eventType);
            }
          } else if (payload.eventType === 'DELETE') {
            // For DELETE, we only have the old data
            onEventsChange(payload.old as Event, 'DELETE');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onEventsChange]);

  // Auto-cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  // Manual refresh of user's presence (useful after stop operations)
  const refreshMyPresence = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${BACKEND_API_URL}/spontaneous/me/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMyPresence(data);
        setIsSharing(true);
        startLocationTracking(data.id);
      } else {
        setMyPresence(null);
        setIsSharing(false);
        stopLocationTracking();
      }
    } catch (error) {
      console.error('Error refreshing my presence:', error);
      setMyPresence(null);
      setIsSharing(false);
      stopLocationTracking();
    }
  }, [userId]);

  return {
    presences,
    myPresence,
    isSharing,
    fetchNearbyPresences,
    startLocationTracking,
    stopLocationTracking,
    refreshMyPresence,
  };
}

