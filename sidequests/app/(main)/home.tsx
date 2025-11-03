import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { darkMode, lightMode } from '../../constants/mapStyles';
import EventBottomSheet from "../../components/EventBottomSheet";
import EventModal from "../../components/EventModal";
import { Event } from '../../types/event';
import { BACKEND_API_URL } from '@env';
import { RadiusCircle } from '../../components/RadiusCircle';
import { useAuth } from '../../context/AuthContext';
import { useSpontaneous } from '../../hooks/useSpontaneous';
import SpontaneousModal from '../../components/SpontaneousModal';
import CreateEventModal from '../../components/CreateEventModal';
import SpontaneousEventModal from '../../components/SpontaneousEventModal';

const Home = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [radiusMi, setRadiusMi] = useState(5);
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [openSpontaneousPresenceId, setOpenSpontaneousPresenceId] = useState<string | null>(null);
  const [showSpontaneousSheet, setShowSpontaneousSheet] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [localIsSharing, setLocalIsSharing] = useState(false);
  const [currentTabMode, setCurrentTabMode] = useState<"Spontaneous" | "RSVP">("RSVP");

  const { presences: spontaneousPresences, fetchNearbyPresences, isSharing: remoteIsSharing, refreshMyPresence, myPresence } = useSpontaneous(user?.id || null);
  
  // Combine remote and local state for isSharing
  const isSharing = localIsSharing || remoteIsSharing;

  // Debug logging
  console.log('Home component - currentTabMode:', currentTabMode);
  console.log('Home component - spontaneousPresences:', spontaneousPresences);
  console.log('Home component - isSharing:', isSharing);
  console.log('Home component - localIsSharing:', localIsSharing);
  console.log('Home component - remoteIsSharing:', remoteIsSharing);

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

  // Fetch events function that can be called manually
  const fetchEvents = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let intervalId;

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
      console.log('Fetching nearby presences for location:', location.latitude, location.longitude, 'radius:', radiusMi);
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
                console.log('Tapped spontaneous presence:', presence);
                setOpenSpontaneousPresenceId(presence.id);
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

      {/* Spontaneous event button - show "Start Spontaneous" only on Spontaneous tab, "Sharing..." on both tabs */}
      {(currentTabMode === "Spontaneous" || isSharing) && (
        <LinearGradient
          colors={['#6a5acd', '#00c6ff', '#9b59b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.spontaneousButtonBorder}
        >
          <TouchableOpacity
            style={[styles.spontaneousButton, isSharing && styles.spontaneousButtonActive]}
            onPress={() => {
              console.log('Start Spontaneous tapped, showSpontaneousSheet will be:', !showSpontaneousSheet);
              setShowSpontaneousSheet(true);
            }}
          >
            <Ionicons
              name={isSharing ? "radio-button-on" : "radio-button-off"}
              size={20}
              color="#fff"
            />
            <Text style={styles.spontaneousButtonText}>
              {isSharing ? "Sharing..." : "Start Spontaneous"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      )}

      {/* Create Event button - show only on RSVP tab */}
      {currentTabMode === "RSVP" && (
        <LinearGradient
          colors={['#6a5acd', '#00c6ff', '#9b59b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.createEventButtonBorder}
        >
          <TouchableOpacity
            style={styles.createEventButton}
            onPress={() => {
              console.log('Create Event tapped');
              setShowCreateEventModal(true);
            }}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color="#fff"
            />
            <Text style={styles.createEventButtonText}>
              Create Event
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      )}

      <EventBottomSheet
        events={filteredByRadius}
        spontaneousPresences={
          // Include user's own presence if active, along with friends' presences
          myPresence && myPresence.is_active && !spontaneousPresences.find(p => p.id === myPresence.id)
            ? [...spontaneousPresences, myPresence]
            : spontaneousPresences
        }
        onOpen={(id) => setOpenEventId(id)}
        onPresenceTap={(presence) => {
          console.log('Tapped spontaneous presence:', presence);
          setOpenSpontaneousPresenceId(presence.id);
        }}
        onModeChange={(mode) => {
          console.log('Home component - onModeChange called with mode:', mode);
          setCurrentTabMode(mode);
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
        currentStatusText={myPresence?.status_text || ''}
        onStart={() => {
          console.log('SpontaneousModal onStart called');
          setLocalIsSharing(true);
          // Refresh nearby presences
          if (location) {
            console.log('Manually fetching presences after start');
            fetchNearbyPresences(location.latitude, location.longitude, radiusMi);
          }
        }}
        onStop={() => {
          console.log('SpontaneousModal onStop called');
          setLocalIsSharing(false);
          // Refresh the user's presence state after stopping
          setTimeout(() => {
            console.log('Refreshing presence after stop');
            refreshMyPresence();
          }, 1000);
        }}
      />

      <CreateEventModal
        isVisible={showCreateEventModal}
        onClose={() => {
          console.log('CreateEventModal closing');
          setShowCreateEventModal(false);
        }}
        onSuccess={async () => {
          console.log('Event created successfully, refreshing events');
          // Add a small delay to ensure database transaction has committed
          setTimeout(async () => {
            console.log('Calling fetchEvents to refresh event list...');
            await fetchEvents();
            console.log('fetchEvents completed');
          }, 500);
        }}
      />

      <SpontaneousEventModal
        visible={!!openSpontaneousPresenceId}
        onClose={() => {
          console.log('SpontaneousEventModal closing');
          setOpenSpontaneousPresenceId(null);
        }}
        presenceId={openSpontaneousPresenceId}
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
  spontaneousButtonBorder: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 22,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
  },
  spontaneousButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  spontaneousButtonActive: {
    backgroundColor: 'rgba(255, 99, 71, 0.3)',
    borderColor: 'rgba(255, 99, 71, 0.5)',
  },
  spontaneousButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gradientTextContainer: {
    borderRadius: 0,
  },
  gradientText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6a5acd',
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
  createEventButtonBorder: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 22,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
  },
  createEventButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createEventButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});