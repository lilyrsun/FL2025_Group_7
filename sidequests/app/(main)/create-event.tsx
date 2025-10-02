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
  Keyboard
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Entypo } from "@expo/vector-icons";
import { BACKEND_API_URL } from "@env";
import PickLocation from "../../components/PickLocation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

const datestringOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

const CreateEvent = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top + 24;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType] = useState<"RSVP" | "Spontaneous">("RSVP");

  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!title || !selectedLocation?.lat || !selectedLocation.lng) {
      Alert.alert("Error", "Please fill in all fields, including location");
      return;
    }

    // For spontaneous events, we don't require a date
    if (type === "RSVP" && !date) {
      Alert.alert("Error", "Please select a date for RSVP events");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BACKEND_API_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: date ? date.toISOString() : null, // Allow null date for spontaneous events
          type,
          latitude: selectedLocation?.lat,
          longitude: selectedLocation?.lng,
          user_id: user?.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Event created!");
        setTitle("");
        setDate(null);
        setSelectedLocation(null);
        setQuery("");
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

  const handleTypeChange = (newType: "RSVP" | "Spontaneous") => {
    setType(newType);
    // If switching to spontaneous, clear the date and hide picker
    if (newType === "Spontaneous") {
      setDate(null);
      setShowDatePicker(false);
    }
  };

  return (
    <LinearGradient
      colors={['#6a5acd', '#00c6ff', '#9b59b6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: statusBarHeight }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>✨ Create Event</Text>
          <Text style={styles.subheading}>Let's make something amazing happen!</Text>
        </View>

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

          {type === "RSVP" && (
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
            </View>
          )}


          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <View style={styles.locationContainer}>
              <PickLocation selected={selectedLocation} setSelected={setSelectedLocation} query={query} setQuery={setQuery} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Event Type</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, type === "RSVP" && styles.activeToggle]}
                onPress={() => handleTypeChange("RSVP")}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.toggleGradient}
                >
                  <View style={[styles.toggleContent, type === "RSVP" && styles.activeToggleContent]}>
                    <Text style={[styles.toggleText, type === "RSVP" && styles.activeToggleText]}>
                      🎫 RSVP
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.toggleBtn, type === "Spontaneous" && styles.activeToggle]}
                onPress={() => handleTypeChange("Spontaneous")}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.toggleGradient}
                >
                  <View style={[styles.toggleContent, type === "Spontaneous" && styles.activeToggleContent]}>
                    <Text style={[styles.toggleText, type === "Spontaneous" && styles.activeToggleText]}>
                      ⚡ Spontaneous
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
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
              {loading ? "Creating magic... ✨" : "🚀 Create Event"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

export default CreateEvent;

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  heading: {
    fontSize: 32,
    fontWeight: "800",
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 24,
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
  toggleContainer: {
    flexDirection: "row",
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: "transparent",
  },
  toggleGradient: {
    padding: 2,
    borderRadius: 16,
  },
  toggleContent: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeToggleContent: {
    backgroundColor: 'transparent',
  },
  activeToggle: {
    shadowColor: '#6a5acd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderColor: "#9b59b6",
  },
  toggleText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    fontSize: 14,
  },
  activeToggleText: {
    color: '#ffffff',
    fontWeight: '700',
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