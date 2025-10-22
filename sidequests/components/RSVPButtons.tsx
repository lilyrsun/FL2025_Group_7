import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BACKEND_API_URL } from "@env";
import { useAuth } from "../context/AuthContext";

type RSVPStatus = "yes" | "no" | "none";

type Props = {
  eventId: string;
  initialStatus?: RSVPStatus; // "yes" | "no" | "none"
  onChanged?: (newStatus: RSVPStatus) => void;
};

const RSVPButtons: React.FC<Props> = ({ eventId, initialStatus = "none", onChanged }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<RSVPStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  const updateRSVP = async (newStatus: RSVPStatus) => {
    if (!user?.id) return;
    if (loading) return;

    setLoading(true);
    try {
      // If user tapped the same status again → remove RSVP
      const effectiveStatus = status === newStatus ? "none" : newStatus;

      const res = await fetch(`${BACKEND_API_URL}/rsvps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          event_id: eventId,
          status: effectiveStatus === "none" ? null : effectiveStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update RSVP");
      }

      setStatus(effectiveStatus);
      onChanged?.(effectiveStatus);

      if (effectiveStatus === "yes") Alert.alert("RSVP", "You're in! 🎉");
      else if (effectiveStatus === "no") Alert.alert("RSVP", "You declined this event.");
      else Alert.alert("RSVP", "RSVP cleared.");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update RSVP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity disabled={loading} onPress={() => updateRSVP("yes")} style={{ flex: 1 }}>
        <LinearGradient
          colors={status === "yes" ? ["#4CAF50", "#2ecc71"] : ["#555", "#444"]}
          style={styles.glassBtn}
        >
          {loading && status === "yes" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.text}>👍 Yes</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity disabled={loading} onPress={() => updateRSVP("no")} style={{ flex: 1 }}>
        <LinearGradient
          colors={status === "no" ? ["#e74c3c", "#c0392b"] : ["#555", "#444"]}
          style={styles.glassBtn}
        >
          {loading && status === "no" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.text}>👎 No</Text>
          )}
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
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default RSVPButtons;
