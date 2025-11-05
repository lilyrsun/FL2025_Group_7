import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import RSVPButtons from './RSVPButtons';
import { BACKEND_API_URL } from '@env';
import type { Event } from '../types/event';
import { Ionicons } from '@expo/vector-icons';
import { lightMode } from '../constants/mapStyles';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type Props = {
  visible: boolean;
  onClose: () => void;
  eventId: string | null;
};

type Attendee = {
  user_id: string;
  status?: "yes" | "no" | null;
  users: { name: string; email: string; id: string; profile_picture?: string };
};

const EventModal: React.FC<Props> = ({ visible, onClose, eventId }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(false);

  const yesAttendees = useMemo(
    () => attendees.filter((a) => a?.status === "yes"),
    [attendees]
  );

  const { user } = useAuth()

  function isUserInAttendees() {
    const attendee = attendees.find((a) => a.user_id === user?.id);
    if (!attendee || !attendee.status) return "none";
    return attendee.status as "yes" | "no" | "none";
  }

  console.log(isUserInAttendees())

  const region = useMemo(() => {
    if (!event) return undefined;
    return {
      latitude: event.latitude,
      longitude: event.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [event]);

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const parts = [];
        if (addr.street) parts.push(addr.street);
        if (addr.streetNumber) parts.push(addr.streetNumber);
        if (parts.length === 0 && addr.name) parts.push(addr.name);
        if (addr.city) parts.push(addr.city);
        if (addr.region) parts.push(addr.region);
        if (addr.postalCode) parts.push(addr.postalCode);
        return parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  const load = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [eventRes, rsvpRes] = await Promise.all([
        fetch(`${BACKEND_API_URL}/events/${eventId}`),
        fetch(`${BACKEND_API_URL}/rsvps/${eventId}`),
      ]);
      const e = await eventRes.json();
      if (eventRes.ok) {
        setEvent(e);
        // Reverse geocode the location
        if (e.latitude !== undefined && e.longitude !== undefined) {
          const address = await reverseGeocode(e.latitude, e.longitude);
          setEventAddress(address);
        }
      } else {
        setEvent(null);
      }
      const r = await rsvpRes.json();
      console.log("EventModal - Loaded RSVPs:", r);
      if (rsvpRes.ok) {
        setAttendees(r);
        console.log("EventModal - Current user RSVP status:", r.find((a: Attendee) => a.user_id === user?.id)?.status);
      } else {
        setAttendees([]);
      }
    } catch (e) {
      console.error("EventModal - Error loading:", e);
      setEvent(null);
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && eventId) {
      load();
    }
  }, [visible, eventId]);

  // Subscribe to realtime updates for event details and RSVPs
  useEffect(() => {
    if (!visible || !eventId) return;

    // Subscribe to event changes
    const eventChannel = supabase
      .channel(`event_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        async (payload) => {
          console.log('Event detail change:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Fetch full event data with user info
            try {
              const response = await fetch(`${BACKEND_API_URL}/events/${eventId}`);
              if (response.ok) {
                const eventData = await response.json();
                setEvent(eventData);
              }
            } catch (error) {
              console.error('Error fetching updated event:', error);
            }
          } else if (payload.eventType === 'DELETE') {
            setEvent(null);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_rsvps',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          console.log('RSVP change:', payload);
          // Reload RSVPs when they change
          try {
            const rsvpRes = await fetch(`${BACKEND_API_URL}/rsvps/${eventId}`);
            if (rsvpRes.ok) {
              const r = await rsvpRes.json();
              setAttendees(r);
            }
          } catch (error) {
            console.error('Error fetching updated RSVPs:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventChannel);
    };
  }, [visible, eventId]);

  const onRsvpChanged = async () => {
    console.log("EventModal - onRsvpChanged called, reloading...");
    // Add a small delay to ensure backend has processed the update
    await new Promise(resolve => setTimeout(resolve, 100));
    await load();
  };

  console.log("Event attendees:", attendees);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <LinearGradient colors={['#6a5acd', '#00c6ff', '#9b59b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" /></View>
        ) : !event ? (
          <View style={styles.center}><Text style={{ color: '#fff' }}>Event not found</Text></View>
        ) : (
          <ScrollView style={styles.content}>
            <View style={styles.hostRow}>
              <Image source={{ uri: event.users?.profile_picture || 'https://via.placeholder.com/50' }} style={styles.hostAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.hostName}>{event.users?.name || event.users?.email}</Text>
              </View>
            </View>

            {event.date && <Text style={styles.sub}>{new Date(event.date).toLocaleString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}</Text>}

            {eventAddress && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.locationText}>{eventAddress}</Text>
              </View>
            )}


            

            {region && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={region}
                  provider={PROVIDER_GOOGLE}
                  customMapStyle={lightMode}
                  showsUserLocation
                >
                  <Marker coordinate={{ latitude: event.latitude, longitude: event.longitude }} title={event.title} />
                </MapView>
              </View>
            )}

            {
              event.user_id!==user?.id &&
              <View style={styles.card}>
                <Text style={styles.cardTitle}>RSVP</Text>
                <RSVPButtons initialStatus={isUserInAttendees()} eventId={event.id} onChanged={onRsvpChanged} />
              </View>
            }

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Attendees ({yesAttendees.length})</Text>
              {yesAttendees.length === 0 ? (
                <Text style={styles.empty}>No RSVPs yet</Text>
              ) : (
                yesAttendees.map((a) => (
                  <View key={a.user_id} style={styles.attendee}>
                    <Image source={{ uri: a.users?.profile_picture || 'https://via.placeholder.com/32' }} style={styles.attendeeAvatar} />
                    <Text style={styles.attendeeName}>{a.users?.name || a.users?.email}
                      {a.user_id===event.user_id && (event.user_id===user?.id ? " (You)" : " (Host)") }</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </Modal>
  );
};

export default EventModal;

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  hostAvatar: { width: 50, height: 50, borderRadius: 25 },
  title: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  hostName: { color: '#ffffff', opacity: 0.85 },
  sub: { color: 'rgba(255,255,255,0.9)', marginTop: 6 },
  mapContainer: { height: 220, borderRadius: 16, overflow: 'hidden', marginVertical: 12 },
  map: { width: '100%', height: '100%' },
  card: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 14, marginVertical: 8 },
  cardTitle: { color: '#ffffff', fontWeight: '700', marginBottom: 8 },
  empty: { color: 'rgba(255,255,255,0.8)' },
  attendee: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  attendeeAvatar: { width: 32, height: 32, borderRadius: 16 },
  attendeeName: { color: '#ffffff' },
});


