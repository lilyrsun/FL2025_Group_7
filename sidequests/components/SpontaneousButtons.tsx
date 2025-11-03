import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BACKEND_API_URL } from "@env";
import { useAuth } from "../context/AuthContext";

type SpontaneousStatus = "coming" | "there" | "none";

type Props = {
  presenceId: string;
  initialStatus?: SpontaneousStatus;
  onChanged?: (newStatus: SpontaneousStatus) => void;
};

const SpontaneousButtons: React.FC<Props> = ({ presenceId, initialStatus = "none", onChanged }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SpontaneousStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: SpontaneousStatus) => {
    if (!user?.id) return;
    if (loading) return;

    setLoading(true);
    try {
      // If user tapped the same status again → remove participation
      const effectiveStatus = status === newStatus ? "none" : newStatus;

      const res = await fetch(`${BACKEND_API_URL}/spontaneous/participate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          presence_id: presenceId,
          status: effectiveStatus === "none" ? null : effectiveStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      setStatus(effectiveStatus);
      onChanged?.(effectiveStatus);

      if (effectiveStatus === "coming") {
        Alert.alert("On my way!", "You're coming to join! 🚶");
      } else if (effectiveStatus === "there") {
        Alert.alert("You're there!", "Great! You've arrived! 🎉");
      } else {
        Alert.alert("Status cleared", "Your status has been cleared.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity disabled={loading} onPress={() => updateStatus("coming")} style={{ flex: 1 }}>
        <LinearGradient
          colors={status === "coming" ? ["#3498db", "#2980b9"] : ["#555", "#444"]}
          style={styles.glassBtn}
        >
          {loading && status === "coming" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.text}>🚶 Coming</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity disabled={loading} onPress={() => updateStatus("there")} style={{ flex: 1 }}>
        <LinearGradient
          colors={status === "there" ? ["#4CAF50", "#2ecc71"] : ["#555", "#444"]}
          style={styles.glassBtn}
        >
          {loading && status === "there" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.text}>✓ There</Text>
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

export default SpontaneousButtons;

