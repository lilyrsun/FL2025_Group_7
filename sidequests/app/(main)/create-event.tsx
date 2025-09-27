import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Platform 
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { BACKEND_API_URL } from "@env";
import PickLocation from "../../components/PickLocation";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CreateEvent = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top + 24;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType] = useState<"RSVP" | "Spontaneous">("RSVP");

  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !date || !selectedLocation?.lat || !selectedLocation.lng) {
      Alert.alert("Error", "Please fill in all fields, including location");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BACKEND_API_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: date.toISOString(), // Send ISO string
          type,
          latitude: selectedLocation?.lat,
          longitude: selectedLocation?.lng,
          user_id: "717650f1-0d2f-44d9-af6d-48c6398167c4", // TODO: replace with logged-in user
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Event created!");
        setTitle("");
        setDate(null);
        setSelectedLocation(null);
      } else {
        Alert.alert("Error", data.error || "Something went wrong");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // keep picker open for iOS
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight }]}>
      <Text style={styles.heading}>Create Event</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />

      {/* Date Picker Trigger */}
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>
          {date ? date.toDateString() : "Pick a Date"}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <PickLocation selected={selectedLocation} setSelected={setSelectedLocation} />

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, type === "RSVP" && styles.active]}
          onPress={() => setType("RSVP")}
        >
          <Text style={styles.toggleText}>RSVP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, type === "Spontaneous" && styles.active]}
          onPress={() => setType("Spontaneous")}
        >
          <Text style={styles.toggleText}>Spontaneous</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.submitBtn} 
        onPress={handleSubmit} 
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? "Creating..." : "Create Event"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateEvent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f9f9f9",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  toggleRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  active: {
    backgroundColor: "#6c5ce7",
    borderColor: "#6c5ce7",
  },
  toggleText: {
    color: "#333",
    fontWeight: "600",
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: "#0984e3",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});