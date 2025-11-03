import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import SpontaneousButtons from './SpontaneousButtons';
import { BACKEND_API_URL } from '@env';
import { SpontaneousPresence } from '../hooks/useSpontaneous';
import { Ionicons } from '@expo/vector-icons';
import { lightMode } from '../constants/mapStyles';
import { useAuth } from '../context/AuthContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  presenceId: string | null;
};

type Participant = {
  user_id: string;
  status: "coming" | "there";
  created_at: string;
  updated_at: string;
  users: { name: string; email: string; id: string; profile_picture?: string };
};

const SpontaneousEventModal: React.FC<Props> = ({ visible, onClose, presenceId }) => {
  const [presence, setPresence] = useState<SpontaneousPresence | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  const comingParticipants = useMemo(
    () => participants.filter((p) => p?.status === "coming"),
    [participants]
  );

  const thereParticipants = useMemo(
    () => participants.filter((p) => p?.status === "there"),
    [participants]
  );

  function getUserStatus() {
    const participant = participants.find((p) => p.user_id === user?.id);
    return (participant?.status as "coming" | "there" | "none") ?? "none";
  }

  const region = useMemo(() => {
    if (!presence) return undefined;
    return {
      latitude: presence.latitude,
      longitude: presence.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [presence]);

  const load = async () => {
    if (!presenceId) return;
    setLoading(true);
    try {
      const [presenceRes, participantsRes] = await Promise.all([
        fetch(`${BACKEND_API_URL}/spontaneous/${presenceId}`),
        fetch(`${BACKEND_API_URL}/spontaneous/${presenceId}/participants`),
      ]);
      
      const p = await presenceRes.json();
      if (presenceRes.ok) setPresence(p); else setPresence(null);
      
      const part = await participantsRes.json();
      if (participantsRes.ok) setParticipants(part); else setParticipants([]);
    } catch (e) {
      console.error('Error loading spontaneous presence:', e);
      setPresence(null);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && presenceId) {
      load();
    }
  }, [visible, presenceId]);

  const onStatusChanged = async () => {
    await load();
  };

  const formatExpiresAt = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins <= 0) return "Expired";
    if (diffMins < 60) return `Expires in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `Expires in ${hours}h ${mins}m`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <LinearGradient colors={['#6a5acd', '#00c6ff', '#9b59b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Spontaneous Hangout</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" /></View>
        ) : !presence ? (
          <View style={styles.center}><Text style={{ color: '#fff' }}>Spontaneous presence not found</Text></View>
        ) : (
          <ScrollView style={styles.content}>
            <View style={styles.hostRow}>
              <Image 
                source={{ uri: presence.users?.profile_picture || 'https://via.placeholder.com/50' }} 
                style={styles.hostAvatar} 
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {presence.users?.name || presence.users?.email}
                  {presence.user_id === user?.id && " (myself)"}
                </Text>
                <Text style={styles.statusText}>{presence.status_text}</Text>
              </View>
            </View>

            <View style={styles.timeInfo}>
              <Ionicons name="time-outline" size={16} color="#ffffff" />
              <Text style={styles.timeText}>{formatExpiresAt(presence.expires_at)}</Text>
            </View>

            {region && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={region}
                  provider={PROVIDER_GOOGLE}
                  customMapStyle={lightMode}
                  showsUserLocation
                >
                  <Marker 
                    coordinate={{ latitude: presence.latitude, longitude: presence.longitude }} 
                    title={presence.status_text || "Spontaneous hangout"}
                  >
                    <Ionicons name="radio-button-on" size={32} color="#4CAF50" />
                  </Marker>
                </MapView>
              </View>
            )}

            {presence.user_id !== user?.id && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Join the Hangout</Text>
                <SpontaneousButtons 
                  presenceId={presence.id} 
                  initialStatus={getUserStatus()} 
                  onChanged={onStatusChanged} 
                />
              </View>
            )}

            {comingParticipants.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Coming ({comingParticipants.length})</Text>
                {comingParticipants.map((p) => (
                  <View key={p.user_id} style={styles.participant}>
                    <Image 
                      source={{ uri: p.users?.profile_picture || 'https://via.placeholder.com/32' }} 
                      style={styles.participantAvatar} 
                    />
                    <Text style={styles.participantName}>
                      {p.users?.name || p.users?.email}
                      {p.user_id === presence.user_id && " (Host)"}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {thereParticipants.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>There ({thereParticipants.length})</Text>
                {thereParticipants.map((p) => (
                  <View key={p.user_id} style={styles.participant}>
                    <Image 
                      source={{ uri: p.users?.profile_picture || 'https://via.placeholder.com/32' }} 
                      style={styles.participantAvatar} 
                    />
                    <Text style={styles.participantName}>
                      {p.users?.name || p.users?.email}
                      {p.user_id === presence.user_id && " (Host)"}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </LinearGradient>
    </Modal>
  );
};

export default SpontaneousEventModal;

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    paddingTop: 32, 
    paddingBottom: 16 
  },
  closeButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hostRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginTop: 8 
  },
  hostAvatar: { width: 50, height: 50, borderRadius: 25 },
  title: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  statusText: { 
    color: 'rgba(255,255,255,0.9)', 
    marginTop: 4,
    fontSize: 14
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  timeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  mapContainer: { 
    height: 220, 
    borderRadius: 16, 
    overflow: 'hidden', 
    marginVertical: 12 
  },
  map: { width: '100%', height: '100%' },
  card: { 
    backgroundColor: 'rgba(255,255,255,0.12)', 
    borderRadius: 16, 
    padding: 14, 
    marginVertical: 8 
  },
  cardTitle: { color: '#ffffff', fontWeight: '700', marginBottom: 12, fontSize: 16 },
  participant: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    paddingVertical: 8 
  },
  participantAvatar: { width: 32, height: 32, borderRadius: 16 },
  participantName: { color: '#ffffff' },
});

