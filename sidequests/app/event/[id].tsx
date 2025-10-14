import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, StatusBar, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, router } from 'expo-router';
import { BACKEND_API_URL } from '@env';
import RSVPButtons from '../../components/RSVPButtons';
import type { Event } from '../../types/event';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Attendee = {
  user_id: string;
  users: { name: string; email: string; avatar_url?: string };
};

const EventDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  const region = useMemo(() => {
    if (!event) return undefined;
    return {
      latitude: event.latitude,
      longitude: event.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [event]);

  useEffect(() => {
    (async () => {
      try {
        const [eventRes, rsvpRes] = await Promise.all([
          fetch(`${BACKEND_API_URL}/events/${id}`),
          fetch(`${BACKEND_API_URL}/rsvps/${id}`),
        ]);

        const eventData = await eventRes.json();
        if (!eventRes.ok) throw new Error(eventData.error || 'Failed to load event');
        setEvent(eventData);

        const rsvpData = await rsvpRes.json();
        if (rsvpRes.ok) setAttendees(rsvpData);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onRsvpChanged = async () => {
    // refresh attendees after RSVP change
    try {
      const res = await fetch(`${BACKEND_API_URL}/rsvps/${id}`);
      const data = await res.json();
      if (res.ok) setAttendees(data);
    } catch {}
  };

  return (
    <LinearGradient
      colors={['#6a5acd', '#00c6ff', '#9b59b6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={[styles.header, { paddingTop: 32 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        {loading && (
          <View style={styles.center}><ActivityIndicator size="large" /></View>
        )}
        {!loading && !event && (
          <View style={styles.center}><Text style={{ color: '#fff' }}>Event not found</Text></View>
        )}
        {!loading && event && (
          <View>
            <View style={styles.hostRow}>
              <Image
                source={{ uri: event.users?.profile_picture || 'https://via.placeholder.com/50' }}
                style={styles.hostAvatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.hostName}>{event.users?.name || event.users?.email || 'Unknown host'}</Text>
              </View>
            </View>
            {event.date && <Text style={styles.sub}>{new Date(event.date).toLocaleString()}</Text>}
            <Text style={styles.sub}>{event.type}</Text>

            {region && (
              <View style={styles.mapContainer}>
                <MapView style={styles.map} initialRegion={region}>
                  <Marker coordinate={{ latitude: event.latitude, longitude: event.longitude }} title={event.title} />
                </MapView>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>RSVP</Text>
              <RSVPButtons eventId={event.id} onChanged={onRsvpChanged} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attendees</Text>
              {attendees.length === 0 ? (
                <Text style={styles.empty}>No RSVPs yet</Text>
              ) : (
                attendees.map((a) => (
                  <View key={a.user_id} style={styles.attendee}>
                    <Text style={styles.attendeeName}>{a.users?.name || a.users?.email}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default EventDetails;

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 12,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  hostName: {
    color: '#ffffff',
    opacity: 0.9,
  },
  empty: {
    color: '#666',
  },
  attendee: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  attendeeName: {
    fontSize: 16,
  },
});


