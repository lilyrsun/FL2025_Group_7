import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar, TextInput, Modal, FlatList, Alert } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BACKEND_API_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import type { Event } from '../../types/event';
import * as ImagePicker from 'expo-image-picker';
import PickLocation from '../../components/PickLocation';

interface WishlistItem {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  note?: string;
  created_at: string;
}

interface DiaryEntry {
  id?: string;
  user_id: string;
  event_id: string;
  reflection?: string;
  photo_urls?: string[];
  created_at?: string;
  updated_at?: string;
}

interface DiaryEvent extends Event {
  diary: DiaryEntry | null;
}

const YourPlot = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const statusBarHeight = insets.top + 24;

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [upcomingRsvps, setUpcomingRsvps] = useState<Event[]>([]);
  const [diaryEvents, setDiaryEvents] = useState<DiaryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wishlist states
  const [showAddWishlist, setShowAddWishlist] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [newWishlistNote, setNewWishlistNote] = useState('');
  const [newWishlistLocation, setNewWishlistLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [wishlistQuery, setWishlistQuery] = useState('');
  
  // Diary states
  const [selectedDiaryEvent, setSelectedDiaryEvent] = useState<DiaryEvent | null>(null);
  const [diaryReflection, setDiaryReflection] = useState('');
  const [diaryPhotos, setDiaryPhotos] = useState<string[]>([]);
  const [showDiaryModal, setShowDiaryModal] = useState(false);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      // Load wishlist
      const wishlistResponse = await fetch(`${BACKEND_API_URL}/wishlist/${user.id}`);
      if (wishlistResponse.ok) {
        const wishlistData = await wishlistResponse.json();
        setWishlist(wishlistData);
      }

      // Load upcoming RSVPs
      const rsvpsResponse = await fetch(`${BACKEND_API_URL}/rsvps/user/${user.id}`);
      if (rsvpsResponse.ok) {
        const rsvpsData = await rsvpsResponse.json();
        setUpcomingRsvps(rsvpsData);
      }

      // Load diary (past events)
      const diaryResponse = await fetch(`${BACKEND_API_URL}/diary/${user.id}`);
      if (diaryResponse.ok) {
        const diaryData = await diaryResponse.json();
        setDiaryEvents(diaryData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const handleAddWishlist = async () => {
    if (!user?.id || !newWishlistName || !newWishlistLocation) {
      Alert.alert('Error', 'Please provide a name and location');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          name: newWishlistName,
          latitude: newWishlistLocation.lat,
          longitude: newWishlistLocation.lng,
          note: newWishlistNote || undefined,
        }),
      });

      if (response.ok) {
        setShowAddWishlist(false);
        setNewWishlistName('');
        setNewWishlistNote('');
        setNewWishlistLocation(null);
        setWishlistQuery('');
        loadData();
      } else {
        Alert.alert('Error', 'Failed to add to wishlist');
      }
    } catch (error) {
      console.error('Error adding wishlist:', error);
      Alert.alert('Error', 'Failed to add to wishlist');
    }
  };

  const handleDeleteWishlist = async (id: string) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/wishlist/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      } else {
        Alert.alert('Error', 'Failed to delete wishlist item');
      }
    } catch (error) {
      console.error('Error deleting wishlist:', error);
      Alert.alert('Error', 'Failed to delete wishlist item');
    }
  };


  const openDiaryEntry = (event: DiaryEvent) => {
    setSelectedDiaryEvent(event);
    setDiaryReflection(event.diary?.reflection || '');
    setDiaryPhotos(event.diary?.photo_urls || []);
    setShowDiaryModal(true);
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && selectedDiaryEvent) {
        // Upload image using FormData (React Native format)
        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);

        const uploadResponse = await fetch(
          `${BACKEND_API_URL}/upload/diary-photo/${selectedDiaryEvent.id}`,
          {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          const updatedPhotos = [...diaryPhotos, url];
          setDiaryPhotos(updatedPhotos);
          
          // Save to diary entry
          await saveDiaryEntry(updatedPhotos);
        } else {
          const errorText = await uploadResponse.text();
          console.error('Upload error:', errorText);
          Alert.alert('Error', 'Failed to upload image');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const saveDiaryEntry = async (photos?: string[]) => {
    if (!user?.id || !selectedDiaryEvent) return;

    try {
      const response = await fetch(`${BACKEND_API_URL}/diary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          event_id: selectedDiaryEvent.id,
          reflection: diaryReflection,
          photo_urls: photos || diaryPhotos,
        }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error saving diary entry:', error);
    }
  };

  const handleSaveDiary = async () => {
    await saveDiaryEntry();
    setShowDiaryModal(false);
  };

  const loadEventAttendees = async (eventId: string) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/diary/event/${eventId}/attendees`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error loading attendees:', error);
    }
    return [];
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#6a5acd', '#00c6ff', '#9b59b6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

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
          <Text style={styles.heading}>📖 Your Plot</Text>
          <Text style={styles.subheading}>Your personal adventure journal</Text>
        </View>

        {/* Wishlist Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.inputLabel}>Wishlist</Text>
            <TouchableOpacity onPress={() => setShowAddWishlist(true)}>
              <Ionicons name="add-circle" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoGradient}
          >
            {wishlist.length === 0 ? (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>No saved locations yet</Text>
              </View>
            ) : (
              wishlist.map((item) => (
                <View key={item.id} style={styles.infoItem}>
                  <View style={styles.wishlistItem}>
                    <View style={styles.wishlistContent}>
                      <Text style={styles.wishlistName}>{item.name}</Text>
                      {item.note && <Text style={styles.wishlistNote}>{item.note}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteWishlist(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </LinearGradient>
        </View>

        {/* Upcoming Events Section */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Upcoming Events</Text>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoGradient}
          >
            {upcomingRsvps.length === 0 ? (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>No upcoming events</Text>
              </View>
            ) : (
              upcomingRsvps.map((evt) => (
                <View key={evt.id} style={styles.infoItem}>
                  <View style={styles.eventItem}>
                    <Text style={styles.eventTitle}>{evt.title}</Text>
                    <Text style={styles.eventDate}>
                      {evt.date ? new Date(evt.date).toLocaleString() : evt.type}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </LinearGradient>
        </View>

        {/* Diary Section */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Diary</Text>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoGradient}
          >
            {diaryEvents.length === 0 ? (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>No past events yet</Text>
              </View>
            ) : (
              diaryEvents.map((evt) => (
                <TouchableOpacity
                  key={evt.id}
                  style={styles.infoItem}
                  onPress={() => openDiaryEntry(evt)}
                >
                  <View style={styles.eventItem}>
                    <Text style={styles.eventTitle}>{evt.title}</Text>
                    <Text style={styles.eventDate}>
                      {evt.date ? new Date(evt.date).toLocaleDateString() : 'Past event'}
                    </Text>
                    {evt.diary && (
                      <View style={styles.diaryIndicator}>
                        <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.diaryIndicatorText}>Has entry</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Add Wishlist Modal */}
      <Modal visible={showAddWishlist} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddWishlist(false)}>
        <LinearGradient
          colors={['#6a5acd', '#00c6ff', '#9b59b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowAddWishlist(false)}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Add to Wishlist</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.modalScrollContent} contentContainerStyle={styles.modalScrollInner}>
            <View style={styles.inputGroup}>
              <Text style={styles.modalInputLabel}>Location Name</Text>
              <LinearGradient
                colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                style={styles.modalInputGradient}
              >
                <TextInput
                  style={styles.modalInput}
                  placeholder="Location name"
                  placeholderTextColor="rgba(106, 90, 205, 0.6)"
                  value={newWishlistName}
                  onChangeText={setNewWishlistName}
                />
              </LinearGradient>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.modalInputLabel}>Location</Text>
              <PickLocation
                selected={newWishlistLocation}
                setSelected={setNewWishlistLocation}
                query={wishlistQuery}
                setQuery={setWishlistQuery}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.modalInputLabel}>Note (optional)</Text>
              <LinearGradient
                colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                style={styles.modalInputGradient}
              >
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="Add a note..."
                  placeholderTextColor="rgba(106, 90, 205, 0.6)"
                  value={newWishlistNote}
                  onChangeText={setNewWishlistNote}
                  multiline
                  numberOfLines={3}
                />
              </LinearGradient>
            </View>
            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleAddWishlist}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalSubmitGradient}
              >
                <Text style={styles.modalSubmitText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Diary Entry Modal */}
      <Modal visible={showDiaryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowDiaryModal(false)}>
        <LinearGradient
          colors={['#6a5acd', '#00c6ff', '#9b59b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowDiaryModal(false)}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              {selectedDiaryEvent?.title || 'Diary Entry'}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.modalScrollContent} contentContainerStyle={styles.modalScrollInner}>
            {selectedDiaryEvent && (
              <>
                <View style={styles.diaryEventInfo}>
                  <Text style={styles.diaryEventTitle}>{selectedDiaryEvent.title}</Text>
                  <Text style={styles.diaryEventDate}>
                    {selectedDiaryEvent.date ? new Date(selectedDiaryEvent.date).toLocaleString() : 'Past event'}
                  </Text>
                  {selectedDiaryEvent.users && (
                    <Text style={styles.diaryEventOrganizer}>
                      Organized by: {selectedDiaryEvent.users.name}
                    </Text>
                  )}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.modalInputLabel}>Reflection</Text>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                    style={styles.modalInputGradient}
                  >
                    <TextInput
                      style={[styles.modalInput, styles.modalTextArea]}
                      placeholder="Write your thoughts about this event..."
                      placeholderTextColor="rgba(106, 90, 205, 0.6)"
                      value={diaryReflection}
                      onChangeText={setDiaryReflection}
                      multiline
                      numberOfLines={6}
                    />
                  </LinearGradient>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.modalInputLabel}>Photos</Text>
                  <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.photoButtonGradient}
                    >
                      <Ionicons name="camera" size={24} color="#ffffff" />
                      <Text style={styles.photoButtonText}>Add Photo</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {diaryPhotos.length > 0 && (
                  <View style={styles.inputGroup}>
                    <FlatList
                      data={diaryPhotos}
                      horizontal
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={({ item }) => (
                        <Image source={{ uri: item }} style={styles.diaryPhoto} />
                      )}
                      contentContainerStyle={styles.photosList}
                      showsHorizontalScrollIndicator={false}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modalSubmitButton}
                  onPress={handleSaveDiary}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalSubmitGradient}
                  >
                    <Text style={styles.modalSubmitText}>Save Entry</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
};

export default YourPlot;

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
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  infoGradient: {
    borderRadius: 16,
    padding: 20,
  },
  infoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  wishlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wishlistContent: {
    flex: 1,
  },
  wishlistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  wishlistNote: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  eventItem: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  diaryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  diaryIndicatorText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
  },
  modalHeader: {
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
  modalHeaderTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  modalScrollContent: {
    flex: 1,
  },
  modalScrollInner: {
    padding: 24,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  modalInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  modalInputGradient: {
    borderRadius: 16,
    padding: 2,
  },
  modalInput: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
    color: '#6a5acd',
    fontWeight: '500',
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalSubmitButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSubmitGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  diaryEventInfo: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  diaryEventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  diaryEventDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  diaryEventOrganizer: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  photoButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoButtonGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  photosList: {
    paddingVertical: 8,
  },
  diaryPhoto: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

