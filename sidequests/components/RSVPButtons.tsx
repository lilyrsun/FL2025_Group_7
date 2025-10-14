import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BACKEND_API_URL } from "@env";
import { useAuth } from "../context/AuthContext";

type Props = {
  eventId: string;
  initiallyRsvped?: boolean;
  onChanged?: (isRsvped: boolean) => void;
};

const RSVPButtons: React.FC<Props> = ({ eventId, initiallyRsvped = false, onChanged }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isRsvped, setIsRsvped] = useState(initiallyRsvped);

  const handleYes = async () => {
    if (!user?.id) return;
    if (isRsvped) return; // already RSVP'd
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_API_URL}/rsvps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id, event_id: eventId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to RSVP");
      }

      setIsRsvped(prev => {
        onChanged?.(!prev);
        return !prev
      });
      Alert.alert("RSVP", "You're in! 🎉");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to RSVP");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!user?.id) return;
    if (!isRsvped) return; // nothing to cancel
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_API_URL}/rsvps`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, eventId }), // note backend expects camelCase here
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel RSVP");
      }
      setIsRsvped(prev => {
        onChanged?.(!prev);
        return !prev
      });
      Alert.alert("RSVP", "RSVP canceled.");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to cancel RSVP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity disabled={loading} onPress={handleYes} style={{ flex: 1 }}>
        <LinearGradient colors={isRsvped ? ['#4CAF50', '#2ecc71'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.glassBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {loading && !isRsvped ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>👍 Yes</Text>}
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity disabled={loading || !isRsvped} onPress={handleCancel} style={{ flex: 1 }}>
        <LinearGradient colors={!isRsvped ? ['#e74c3c', '#c0392b'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.glassBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {loading && isRsvped ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>👎 No</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
  },
  glassBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  text: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default RSVPButtons;

