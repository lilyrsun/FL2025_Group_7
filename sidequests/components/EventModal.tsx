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

type Props = {
  visible: boolean;
  onClose: () => void;
  eventId: string | null;
};

type Attendee = {
  user_id: string;
  status: "yes" | "no";
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
    return attendee?.status ?? "none";
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

  const load = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [eventRes, rsvpRes] = await Promise.all([
        fetch(`${BACKEND_API_URL}/events/${eventId}`),
        fetch(`${BACKEND_API_URL}/rsvps/${eventId}`),
      ]);
      const e = await eventRes.json();
      if (eventRes.ok) setEvent(e); else setEvent(null);
      const r = await rsvpRes.json();
      if (rsvpRes.ok) setAttendees(r); else setAttendees([]);
    } catch (e) {
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

  const onRsvpChanged = async () => {
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


