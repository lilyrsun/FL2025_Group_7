import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Platform,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Modal
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { BACKEND_API_URL } from "@env";
import PickLocation from "./PickLocation";
import { useAuth } from "../context/AuthContext";

const datestringOptions: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const CreateEventModal: React.FC<Props> = ({ isVisible, onClose, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!title || !selectedLocation?.lat || !selectedLocation.lng) {
      Alert.alert("Error", "Please fill in all fields, including location");
      return;
    }

    if (!date) {
      Alert.alert("Error", "Please select a date for RSVP events");
      return;
    }

    try {
      setLoading(true);

      const isoDate = date.toISOString().replace("T", " ");

      const res = await fetch(`${BACKEND_API_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: isoDate,
          type: "RSVP",
          latitude: selectedLocation?.lat,
          longitude: selectedLocation?.lng,
          user_id: user?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.error || "Something went wrong");
        return;
      }

      console.log("Event created successfully:", data);

      // Reset form
      setTitle("");
      setDate(null);
      setSelectedLocation(null);
      setQuery("");
      setShowDatePicker(false);
      setShowTimePicker(false);
      
      // Close modal first
      onClose();
      
      // Call success callback to refresh events after a brief delay
      // This ensures the database transaction has fully committed
      setTimeout(() => {
        onSuccess?.();
      }, 300);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onChangeTime = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setDate((prev) => {
        const base = prev || new Date();
        const merged = new Date(base);
        merged.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
        return merged;
      });
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setTitle("");
    setDate(null);
    setSelectedLocation(null);
    setQuery("");
    setShowDatePicker(false);
    setShowTimePicker(false);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <LinearGradient
        colors={['#6a5acd', '#00c6ff', '#9b59b6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>✨ Create Event</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView 
            style={styles.container} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Title</Text>
                <LinearGradient
                  colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                  style={styles.inputGradient}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="What's the vibe? 🌟"
                    placeholderTextColor="rgba(106, 90, 205, 0.6)"
                    value={title}
                    onChangeText={setTitle}
                  />
                </LinearGradient>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date & Time</Text>
                <LinearGradient
                  colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                  style={styles.inputGradient}
                >
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(prev => !prev)}
                  >
                    <View style={styles.dateInputContent}>
                      <Text style={[styles.dateText, !date && styles.placeholderText]}>
                        {date ? date.toLocaleDateString("en-US", datestringOptions) : "📅 Pick a date"}
                      </Text>
                      <Entypo 
                        name={showDatePicker ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="rgba(106, 90, 205, 0.6)" 
                      />
                    </View>
                  </TouchableOpacity>
                </LinearGradient>

                {showDatePicker && (
                  <LinearGradient
                    colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                    style={styles.datePickerGradient}
                  >
                    <DateTimePicker
                      value={date || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={onChangeDate}
                      textColor="#6a5acd"
                      style={styles.datePicker}
                    />
                  </LinearGradient>
                )}

                <LinearGradient
                  colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                  style={[styles.inputGradient, { marginTop: 12 }]}
                >
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowTimePicker(prev => !prev)}
                  >
                    <View style={styles.dateInputContent}>
                      <Text style={[styles.dateText, !date && styles.placeholderText]}>
                        {date ? date.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true }) : "⏰ Pick a time"}
                      </Text>
                      <Entypo 
                        name={showTimePicker ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="rgba(106, 90, 205, 0.6)" 
                      />
                    </View>
                  </TouchableOpacity>
                </LinearGradient>

                {showTimePicker && (
                  <LinearGradient
                    colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                    style={styles.datePickerGradient}
                  >
                    <DateTimePicker
                      value={date || new Date()}
                      mode="time"
                      display="spinner"
                      is24Hour={false}
                      onChange={onChangeTime}
                      textColor="#6a5acd"
                      style={styles.datePicker}
                    />
                  </LinearGradient>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <View style={styles.locationContainer}>
                  <PickLocation selected={selectedLocation} setSelected={setSelectedLocation} query={query} setQuery={setQuery} />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.submitContainer}
              onPress={handleSubmit} 
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#a8a8a8', '#888888'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>
                  {loading ? "Creating magic... ✨" : "Create Event"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 32,
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
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  formContainer: {
    // marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  inputGradient: {
    borderRadius: 16,
    padding: 2,
  },
  input: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
    color: '#6a5acd',
    fontWeight: '500',
  },
  dateInput: {
    padding: 16,
    borderRadius: 14,
  },
  dateInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#6a5acd',
    fontWeight: '500',
    flex: 1,
  },
  placeholderText: {
    color: 'rgba(106, 90, 205, 0.6)',
  },
  locationContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitContainer: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  submitGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 20,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  datePickerGradient: {
    borderRadius: 16,
    padding: 2,
    marginTop: 12,
  },
  datePicker: {
    backgroundColor: 'transparent',
    borderRadius: 14,
  },
});

export default CreateEventModal;

