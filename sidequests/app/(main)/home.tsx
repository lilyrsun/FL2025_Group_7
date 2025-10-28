import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { darkMode, lightMode } from '../../constants/mapStyles';
import EventBottomSheet from "../../components/EventBottomSheet";
import EventModal from "../../components/EventModal";
import { Event } from '../../types/event';
import { BACKEND_API_URL } from '@env';
import { RadiusCircle } from '../../components/RadiusCircle';
import { useAuth } from '../../context/AuthContext';
import { useSpontaneous } from '../../hooks/useSpontaneous';
import SpontaneousModal from '../../components/SpontaneousModal';

const Home = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [radiusMi, setRadiusMi] = useState(5);
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [showSpontaneousSheet, setShowSpontaneousSheet] = useState(false);
  const [localIsSharing, setLocalIsSharing] = useState(false);

  const { presences: spontaneousPresences, fetchNearbyPresences } = useSpontaneous(user?.id || null);
  
  // Combine remote and local state for isSharing
  const isSharing = localIsSharing;

  const filteredByRadius = useMemo(() => {
    if (!location) return events;
    const R = 3958.8; // Earth radius in miles
    const toRad = (d: number) => (d * Math.PI) / 180;
    return events.filter((e) => {
      const dLat = toRad(e.latitude - location.latitude);
      const dLon = toRad(e.longitude - location.longitude);
      const lat1 = toRad(location.latitude);
      const lat2 = toRad(e.latitude);
      const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      return d <= radiusMi;
    });
  }, [events, location, radiusMi]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    let intervalId;

    const fetchEvents = async () => {
      try {
        // Check if BACKEND_API_URL is available
        if (!BACKEND_API_URL) {
          console.warn("⚠️ BACKEND_API_URL not configured, skipping events fetch");
          return;
        }

        console.log("🌐 Fetching events from backend...");
        const res = await fetch(BACKEND_API_URL + "/events");

        if (!res.ok) {
          console.error("❌ Backend responded with an error:", res.status, res.statusText);
          return;
        }

        const rawEvents = await res.json();

        const mapped = rawEvents.map((e : Event) => ({
          id: e.id,
          title: e.title,
          date: e.date,
          type: e.type,
          latitude: e.latitude,
          longitude: e.longitude,
          created_at: e.created_at,
          user_id: e.user_id,
          users: e.users,
        }));

        console.log(mapped)

        setEvents(mapped);
        console.log(`✅ Events loaded successfully: ${mapped.length} events`);
      } catch (err) {
        if (err instanceof TypeError && err.message === "Network request failed") {
          console.warn("🚫 Backend server appears to be offline. Events will not be loaded.");
          setEvents([]);
        } else {
          console.error("💥 Failed to fetch events:", err);
          setEvents([]);
        }
      }
    };

    // Initial fetch
    fetchEvents();

    // Poll every 10 seconds
    intervalId = setInterval(fetchEvents, 10000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [BACKEND_API_URL]);

  // Fetch nearby spontaneous presences when location changes
  useEffect(() => {
    if (location && user?.id) {
      fetchNearbyPresences(location.latitude, location.longitude, radiusMi);
    }
  }, [location, radiusMi, user?.id, fetchNearbyPresences]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          provider={PROVIDER_GOOGLE}
          customMapStyle={lightMode}
        >
          <RadiusCircle location={location} radiusMi={radiusMi} />
          {/* <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="You are here"
            image={require("../../assets/icons/map-pin.png")}
          /> */}

          {/* RSVP Events */}
          {filteredByRadius.map((event) => (
            <Marker
              key={event.id}
              coordinate={{
                latitude: event.latitude,
                longitude: event.longitude,
              }}
              title={event.title}
              description={event.date}
              pinColor={event.type === "RSVP" ? "blue" : "orange"}
              onPress={() => setOpenEventId(event.id)}
            />
          ))}

          {/* Spontaneous Presences */}
          {spontaneousPresences.map((presence) => (
            <Marker
              key={presence.id}
              coordinate={{
                latitude: presence.latitude,
                longitude: presence.longitude,
              }}
              title={presence.users?.name || 'Friend'}
              description={presence.status_text}
              onPress={() => {
                // Could show a modal with join option
                console.log('Tapped spontaneous presence:', presence);
              }}
            >
              {presence.users?.profile_picture ? (
                <View style={styles.presenceMarker}>
                  <Image
                    source={{ uri: presence.users.profile_picture }}
                    style={styles.profileImage}
                  />
                  <View style={styles.statusDot} />
                </View>
              ) : (
                <Ionicons name="radio-button-on" size={32} color="#4CAF50" />
              )}
            </Marker>
          ))}
        </MapView>
      )}

      <View style={styles.radiusControl}>
        <TouchableOpacity style={styles.radiusBtn} onPress={() => setRadiusMi((r) => Math.max(1, r - 1))}>
          <Text style={styles.radiusBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.radiusText}>{radiusMi} mi</Text>
        <TouchableOpacity style={styles.radiusBtn} onPress={() => setRadiusMi((r) => Math.min(50, r + 1))}>
          <Text style={styles.radiusBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Spontaneous event button */}
      <TouchableOpacity
        style={[styles.spontaneousButton, isSharing && styles.spontaneousButtonActive]}
        onPress={() => {
          console.log('Start Spontaneous tapped, showSpontaneousSheet will be:', !showSpontaneousSheet);
          setShowSpontaneousSheet(true);
        }}
      >
        <Ionicons
          name={isSharing ? "radio-button-on" : "radio-button-off"}
          size={24}
          color="#fff"
        />
        <Text style={styles.spontaneousButtonText}>
          {isSharing ? "Sharing..." : "Start Spontaneous"}
        </Text>
      </TouchableOpacity>

      <EventBottomSheet
        events={filteredByRadius}
        spontaneousPresences={spontaneousPresences}
        onOpen={(id) => setOpenEventId(id)}
        onPresenceTap={(presence) => {
          console.log('Tapped spontaneous presence:', presence);
          // Could navigate to details or show more info
        }}
      />
      <EventModal visible={!!openEventId} eventId={openEventId} onClose={() => setOpenEventId(null)} />
      
      <SpontaneousModal
        isVisible={showSpontaneousSheet}
        onClose={() => {
          console.log('SpontaneousModal closing');
          setShowSpontaneousSheet(false);
        }}
        isActive={isSharing}
        onStart={() => {
          setLocalIsSharing(true);
          // Refresh nearby presences
          if (location) {
            fetchNearbyPresences(location.latitude, location.longitude, radiusMi);
          }
        }}
        onStop={() => {
          setLocalIsSharing(false);
        }}
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  radiusControl: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 40,
  },
  radiusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  radiusText: {
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spontaneousButton: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  spontaneousButtonActive: {
    backgroundColor: '#f44336',
  },
  spontaneousButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  presenceMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
});