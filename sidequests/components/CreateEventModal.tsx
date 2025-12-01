import React, { useState, useEffect } from "react";
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
  Modal,
  Image,
  FlatList
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { BACKEND_API_URL } from "@env";
import PickLocation from "./PickLocation";
import { useAuth } from "../context/AuthContext";
import PrimaryButton from "./PrimaryButton";

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
  initialTitle?: string;
  initialLocation?: { address: string; lat: number; lng: number };
};

interface Friend {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
}

const CreateEventModal: React.FC<Props> = ({ isVisible, onClose, onSuccess, initialTitle, initialLocation }) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showFriendsSelector, setShowFriendsSelector] = useState(false);
  const [restrictToFriends, setRestrictToFriends] = useState(false);

  const { user } = useAuth();

  // Set initial values when modal opens with props
  useEffect(() => {
    if (isVisible) {
      if (initialTitle) {
        setTitle(initialTitle);
      }
      if (initialLocation) {
        setSelectedLocation(initialLocation);
        setQuery(initialLocation.address || "");
      }
      if (user?.id) {
        loadFriends();
      }
    } else {
      // Reset form when modal closes
      setTitle("");
      setDate(null);
      setSelectedLocation(null);
      setQuery("");
      setShowDatePicker(false);
      setShowTimePicker(false);
      setSelectedFriends([]);
      setRestrictToFriends(false);
      setShowFriendsSelector(false);
    }
  }, [isVisible, initialTitle, initialLocation, user?.id]);

  const roundToMinuteInterval = (value: Date, intervalMinutes: number) => {
    const intervalMs = intervalMinutes * 60 * 1000;
    return new Date(Math.round(value.getTime() / intervalMs) * intervalMs);
  };

  const loadFriends = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${BACKEND_API_URL}/friends/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

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
          invitee_ids: restrictToFriends ? selectedFriends : null, // null means public to all friends
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
      setSelectedFriends([]);
      setRestrictToFriends(false);
      setShowFriendsSelector(false);
      
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
      const roundedTime = roundToMinuteInterval(selectedTime, 5);
      setDate((prev) => {
        const base = prev || new Date();
        const merged = new Date(base);
        merged.setHours(roundedTime.getHours(), roundedTime.getMinutes(), 0, 0);
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
    setSelectedFriends([]);
    setRestrictToFriends(false);
    setShowFriendsSelector(false);
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
                      minuteInterval={5}
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

              <View style={styles.inputGroup}>
                <View style={styles.restrictRow}>
                  <View style={styles.restrictLabelContainer}>
                    <Text style={styles.inputLabel}>Restrict to Friends</Text>
                    {restrictToFriends && (
                      <Text style={styles.friendsCountText}>
                        {selectedFriends.length === 0 
                          ? "All friends can see"
                          : `${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''} selected`}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.toggleContainer}
                    onPress={() => {
                      setRestrictToFriends(!restrictToFriends);
                      if (!restrictToFriends) {
                        setShowFriendsSelector(true);
                      } else {
                        setSelectedFriends([]);
                      }
                    }}
                  >
                    <LinearGradient
                      colors={restrictToFriends ? ['rgba(106, 90, 205, 0.3)', 'rgba(155, 89, 182, 0.2)'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                      style={styles.toggleGradient}
                    >
                      <Ionicons 
                        name={restrictToFriends ? "checkmark-circle" : "ellipse-outline"} 
                        size={24} 
                        color={restrictToFriends ? "#ffffff" : "rgba(255,255,255,0.5)"} 
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                {restrictToFriends && (
                  <View style={styles.friendsSelectorContainer}>
                    <TouchableOpacity
                      style={styles.selectFriendsButton}
                      onPress={() => setShowFriendsSelector(!showFriendsSelector)}
                    >
                      <LinearGradient
                        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                        style={styles.selectFriendsGradient}
                      >
                        <View style={styles.selectFriendsContent}>
                          <Text style={styles.selectFriendsText}>
                            {showFriendsSelector ? "Hide Friends" : "Select Friends"}
                          </Text>
                          <Ionicons 
                            name={showFriendsSelector ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="rgba(106, 90, 205, 0.6)" 
                          />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    {showFriendsSelector && friends.length > 0 && (
                      <View style={styles.friendsList}>
                        <FlatList
                          data={friends}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => {
                            const isSelected = selectedFriends.includes(item.id);
                            return (
                              <TouchableOpacity
                                style={[styles.friendItem, isSelected && styles.friendItemSelected]}
                                onPress={() => toggleFriendSelection(item.id)}
                              >
                                <Image
                                  source={{ uri: item.profile_picture || 'https://via.placeholder.com/40' }}
                                  style={styles.friendAvatar}
                                />
                                <Text style={styles.friendName}>{item.name}</Text>
                                <Ionicons
                                  name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                                  size={24}
                                  color={isSelected ? "#6a5acd" : "rgba(106, 90, 205, 0.3)"}
                                />
                              </TouchableOpacity>
                            );
                          }}
                          nestedScrollEnabled
                        />
                      </View>
                    )}
                    
                    {showFriendsSelector && friends.length === 0 && (
                      <View style={styles.noFriendsContainer}>
                        <Text style={styles.noFriendsText}>No friends yet. Add friends to restrict events.</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

            <PrimaryButton
              title={loading ? "Creating magic... ✨" : "Create Event"}
              onPress={handleSubmit}
              disabled={loading}
              loading={loading}
            />
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
  datePickerGradient: {
    borderRadius: 16,
    padding: 2,
    marginTop: 12,
  },
  datePicker: {
    backgroundColor: 'transparent',
    borderRadius: 14,
  },
  restrictRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  restrictLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  friendsCountText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  toggleContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  toggleGradient: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendsSelectorContainer: {
    marginTop: 12,
  },
  selectFriendsButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  selectFriendsGradient: {
    borderRadius: 16,
    padding: 2,
  },
  selectFriendsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
  },
  selectFriendsText: {
    fontSize: 16,
    color: '#6a5acd',
    fontWeight: '500',
  },
  friendsList: {
    maxHeight: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  friendItemSelected: {
    backgroundColor: 'rgba(106, 90, 205, 0.2)',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendName: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  noFriendsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noFriendsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CreateEventModal;

