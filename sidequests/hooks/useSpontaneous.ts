import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BACKEND_API_URL } from '@env';
import * as Location from 'expo-location';

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

export function useSpontaneous(userId: string | null) {
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
      // For demo purposes, simulate location updates with San Francisco coordinates
      // TODO: Replace with real location tracking in production
      console.log('Starting demo location tracking for presence:', presenceId);
      
      const demoLocationUpdate = async () => {
        if (!userId) return;

        try {
          // Add slight random variation to simulate movement
          const latitude = 37.7749 + (Math.random() - 0.5) * 0.005;
          const longitude = -122.4194 + (Math.random() - 0.5) * 0.005;
          
          await fetch(`${BACKEND_API_URL}/spontaneous/update-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              latitude,
              longitude,
              accuracy: 10,
            }),
          });
          
          console.log('Updated demo location:', { latitude, longitude });
        } catch (error) {
          console.error('Error updating location:', error);
        }
      };

      // Update location every 30 seconds
      const interval = setInterval(demoLocationUpdate, 30000);
      
      // Store interval ID for cleanup
      setLocationWatcher({ remove: () => clearInterval(interval) } as any);
      
      // Uncomment below for real location tracking in production:
      /*
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
                accuracy: location.coords.accuracy,
              }),
            });
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }
      );

      setLocationWatcher(watcher);
      */
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
        setPresences(data);
      }
    } catch (error) {
      console.error('Error fetching nearby presences:', error);
    }
  }, [userId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!userId) return;

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
        (payload) => {
          console.log('Spontaneous presence change:', payload);

          // Handle INSERT, UPDATE, DELETE
          if (payload.eventType === 'INSERT') {
            // Only add if it's not the current user's presence
            if (payload.new.user_id !== userId) {
              // Fetch the updated list
              fetchNearbyPresences(0, 0);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update or remove based on is_active
            setPresences((prev) => {
              if (payload.new.is_active && payload.new.user_id !== userId) {
                return [...prev.filter(p => p.id !== payload.new.id), payload.new as SpontaneousPresence];
              } else {
                return prev.filter(p => p.id !== payload.old.id);
              }
            });
          } else if (payload.eventType === 'DELETE') {
            setPresences((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNearbyPresences]);

  // Auto-cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  return {
    presences,
    myPresence,
    isSharing,
    fetchNearbyPresences,
    startLocationTracking,
    stopLocationTracking,
  };
}

