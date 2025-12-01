import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar, TextInput, Modal, FlatList, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BACKEND_API_URL, SUPABASE_URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import type { Event } from '../../types/event';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import PickLocation from '../../components/PickLocation';
import EventModal from '../../components/EventModal';
import CreateEventModal from '../../components/CreateEventModal';
import PhotoViewer from '../../components/PhotoViewer';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { lightMode } from '../../constants/mapStyles';

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

  const [activeTab, setActiveTab] = useState<'wishlist' | 'upcoming' | 'diary'>('upcoming');
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
  const [selectedWishlistItem, setSelectedWishlistItem] = useState<WishlistItem | null>(null);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  
  // Diary states
  const [selectedDiaryEvent, setSelectedDiaryEvent] = useState<DiaryEvent | null>(null);
  const [diaryReflection, setDiaryReflection] = useState('');
  const [diaryPhotos, setDiaryPhotos] = useState<string[]>([]);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Address states for reverse geocoding
  const [diaryEventAddress, setDiaryEventAddress] = useState<string | null>(null);
  const [wishlistItemAddress, setWishlistItemAddress] = useState<string | null>(null);
  
  // Event modal state
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [createEventFromWishlist, setCreateEventFromWishlist] = useState<{ title: string; location: { address: string; lat: number; lng: number } } | null>(null);
  
  // Full-screen image viewer state
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);

  // Debug: Log when photo viewer state changes
  useEffect(() => {
    console.log('Photo viewer state changed:', { showPhotoViewer, selectedPhotoUrl });
  }, [showPhotoViewer, selectedPhotoUrl]);

  // Helper function to replace localhost URLs with ngrok/public URL
  const replaceLocalhostUrl = (url: string): string => {
    if (!url || !url.includes('localhost:54321')) {
      return url;
    }
    
    // Try to get the public URL from SUPABASE_URL (for photo URLs) or BACKEND_API_URL
    // Extract the base URL (e.g., https://abc123.ngrok.io from https://abc123.ngrok.io:4000)
    try {
      // First try SUPABASE_URL (for Supabase storage URLs)
      const supabaseUrl = SUPABASE_URL ? new URL(SUPABASE_URL) : null;
      if (supabaseUrl && !supabaseUrl.hostname.includes('localhost')) {
        const baseUrl = `${supabaseUrl.protocol}//${supabaseUrl.hostname}`;
        return url.replace(/http:\/\/localhost:54321/g, baseUrl);
      }
      
      // Fallback to BACKEND_API_URL
      const backendUrl = new URL(BACKEND_API_URL);
      if (!backendUrl.hostname.includes('localhost')) {
        const baseUrl = `${backendUrl.protocol}//${backendUrl.hostname}`;
        return url.replace(/http:\/\/localhost:54321/g, baseUrl);
      }
      
      // If both are still localhost, return original URL
      return url;
    } catch (e) {
      console.error('Error replacing localhost URL:', e);
      return url;
    }
  };

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

  const handleCreateEventFromWishlist = async (item: WishlistItem) => {
    // Get the address for the location
    let address = wishlistItemAddress;
    if (!address && item.latitude !== undefined && item.longitude !== undefined) {
      address = await reverseGeocode(item.latitude, item.longitude);
    }
    
    // Set the pre-filled data for CreateEventModal
    setCreateEventFromWishlist({
      title: item.name,
      location: {
        address: address || `${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}`,
        lat: item.latitude,
        lng: item.longitude,
      },
    });
    
    // Close wishlist modal and open create event modal
    setShowWishlistModal(false);
    setShowCreateEventModal(true);
  };


  const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const parts = [];
        if (addr.street) parts.push(addr.street);
        if (addr.streetNumber) parts.push(addr.streetNumber);
        if (parts.length === 0 && addr.name) parts.push(addr.name);
        if (addr.city) parts.push(addr.city);
        if (addr.region) parts.push(addr.region);
        if (addr.postalCode) parts.push(addr.postalCode);
        return parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  const openDiaryEntry = async (event: DiaryEvent) => {
    setSelectedDiaryEvent(event);
    setDiaryReflection(event.diary?.reflection || '');
    
    // Handle photo_urls - might be string or array
    let photos = event.diary?.photo_urls || [];
    if (typeof photos === 'string') {
      try {
        photos = JSON.parse(photos);
      } catch (e) {
        console.error('Error parsing photo_urls:', e);
        photos = [];
      }
    }
    if (!Array.isArray(photos)) {
      photos = [];
    }
    // Replace localhost URLs with ngrok URL for physical devices
    photos = photos.map(photo => replaceLocalhostUrl(photo));
    setDiaryPhotos(photos);
    
    console.log('Loaded diary photos:', photos);
    setShowDiaryModal(true);
    
    // Reverse geocode the location
    if (event.latitude !== undefined && event.longitude !== undefined) {
      const address = await reverseGeocode(event.latitude, event.longitude);
      setDiaryEventAddress(address);
    }
  };

  const handlePickImage = async (source: 'library' | 'camera' = 'library') => {
    if (!selectedDiaryEvent) return;

    try {
      // Request permissions
      let permissionResult;
      if (source === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission needed',
          `Please grant ${source === 'camera' ? 'camera' : 'photo library'} permissions`
        );
        return;
      }

      // Launch image picker or camera
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0] && selectedDiaryEvent) {
        setUploadingPhoto(true);
        
        try {
          // Upload image using FormData (React Native format)
          const formData = new FormData();
          const asset = result.assets[0];
          
          // Get file extension from URI or use jpg as default
          const uriParts = asset.uri.split('.');
          const fileType = uriParts[uriParts.length - 1] || 'jpg';
          
          formData.append('file', {
            uri: asset.uri,
            type: `image/${fileType}`,
            name: `photo.${fileType}`,
          } as any);

          const uploadResponse = await fetch(
            `${BACKEND_API_URL}/upload/diary-photo/${selectedDiaryEvent.id}`,
            {
              method: 'POST',
              body: formData,
              // Don't set Content-Type header - let fetch set it with boundary
            }
          );

          if (uploadResponse.ok) {
            const { url } = await uploadResponse.json();
            const updatedPhotos = [...diaryPhotos, url];
            setDiaryPhotos(updatedPhotos);
            
            // Save to diary entry
            await saveDiaryEntry(updatedPhotos);
            Alert.alert('Success', 'Photo uploaded successfully');
          } else {
            const errorText = await uploadResponse.text();
            console.error('Upload error:', errorText);
            Alert.alert('Error', 'Failed to upload image');
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('Error', 'Failed to upload image');
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedPhotos = diaryPhotos.filter(url => url !== photoUrl);
            setDiaryPhotos(updatedPhotos);
            await saveDiaryEntry(updatedPhotos);
          },
        },
      ]
    );
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
        const savedEntry = await response.json();
        // Update the selected event with the saved data
        if (savedEntry && selectedDiaryEvent) {
          setSelectedDiaryEvent({
            ...selectedDiaryEvent,
            diary: {
              ...(selectedDiaryEvent.diary || {}),
              id: savedEntry.id || selectedDiaryEvent.diary?.id,
              user_id: savedEntry.user_id || selectedDiaryEvent.diary?.user_id || user.id,
              event_id: savedEntry.event_id || selectedDiaryEvent.diary?.event_id || selectedDiaryEvent.id,
              reflection: savedEntry.reflection,
              photo_urls: savedEntry.photo_urls || [],
              created_at: savedEntry.created_at || selectedDiaryEvent.diary?.created_at,
              updated_at: savedEntry.updated_at || selectedDiaryEvent.diary?.updated_at,
            } as DiaryEntry
          });
          // Also update the local photos state to ensure UI is in sync
          if (savedEntry.photo_urls) {
            setDiaryPhotos(savedEntry.photo_urls);
          }
        }
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

  const diaryEventRegion = useMemo(() => {
    if (!selectedDiaryEvent) return undefined;
    return {
      latitude: selectedDiaryEvent.latitude,
      longitude: selectedDiaryEvent.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [selectedDiaryEvent]);

  const wishlistItemRegion = useMemo(() => {
    if (!selectedWishlistItem) return undefined;
    return {
      latitude: selectedWishlistItem.latitude,
      longitude: selectedWishlistItem.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [selectedWishlistItem]);

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
      {/* Header */}
      <View style={[styles.header, { paddingTop: statusBarHeight }]}>
        <Text style={styles.headerTitle}>📖 Your Plot</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wishlist' && styles.activeTab]}
          onPress={() => setActiveTab('wishlist')}
        >
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>
            Wishlist
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'diary' && styles.activeTab]}
          onPress={() => setActiveTab('diary')}
        >
          <Text style={[styles.tabText, activeTab === 'diary' && styles.activeTabText]}>
            Diary
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'wishlist' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.inputLabel}>Wishlist</Text>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => setShowAddWishlist(true)}
              >
                <Ionicons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.infoGradient}
            >
              {wishlist.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="heart-outline" size={64} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.emptyText}>No saved locations yet</Text>
                  <Text style={styles.emptySubtext}>Add locations to your wishlist to visit later!</Text>
                </View>
              ) : (
                wishlist.map((item, index) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[
                      styles.infoItem,
                      index < wishlist.length - 1 && styles.infoItemSeparator
                    ]}
                    onPress={async () => {
                      setSelectedWishlistItem(item);
                      setShowWishlistModal(true);
                      // Reverse geocode the location
                      if (item.latitude !== undefined && item.longitude !== undefined) {
                        const address = await reverseGeocode(item.latitude, item.longitude);
                        setWishlistItemAddress(address);
                      }
                    }}
                  >
                    <View style={styles.wishlistItem}>
                      <View style={styles.wishlistContent}>
                        <Text style={styles.wishlistName}>{item.name}</Text>
                        {item.note && <Text style={styles.wishlistNote}>{item.note}</Text>}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </LinearGradient>
          </View>
        )}

        {activeTab === 'upcoming' && (
          <View style={styles.tabContent}>
            <Text style={styles.inputLabel}>Upcoming Events</Text>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.infoGradient}
            >
              {upcomingRsvps.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={64} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.emptyText}>No upcoming events</Text>
                  <Text style={styles.emptySubtext}>Events you RSVP to will appear here</Text>
                </View>
              ) : (
                upcomingRsvps.map((evt, index) => (
                  <TouchableOpacity
                    key={evt.id}
                    style={[
                      styles.infoItem,
                      index < upcomingRsvps.length - 1 && styles.infoItemSeparator
                    ]}
                    onPress={() => setOpenEventId(evt.id)}
                  >
                    <View style={styles.eventItem}>
                      <Text style={styles.eventTitle}>{evt.title}</Text>
                      <Text style={styles.eventDate}>
                        {evt.date ? new Date(evt.date).toLocaleString() : evt.type}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                ))
              )}
            </LinearGradient>
          </View>
        )}

        {activeTab === 'diary' && (
          <View style={styles.tabContent}>
            <Text style={styles.inputLabel}>Diary</Text>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.infoGradient}
            >
              {diaryEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="book-outline" size={64} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.emptyText}>No past events yet</Text>
                  <Text style={styles.emptySubtext}>After events, you can add diary entries here</Text>
                </View>
              ) : (
                diaryEvents.map((evt, index) => (
                  <TouchableOpacity
                    key={evt.id}
                    style={[
                      styles.infoItem,
                      index < diaryEvents.length - 1 && styles.infoItemSeparator
                    ]}
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
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                ))
              )}
            </LinearGradient>
          </View>
        )}
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
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              style={styles.modalScrollContent} 
              contentContainerStyle={styles.modalScrollInner}
              keyboardShouldPersistTaps="handled"
            >
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
          </KeyboardAvoidingView>
        </LinearGradient>
      </Modal>

      {/* Diary Entry Modal */}
      <Modal visible={showDiaryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => {
        setShowDiaryModal(false);
        setDiaryEventAddress(null);
      }}>
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
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              style={styles.modalScrollContent} 
              contentContainerStyle={styles.modalScrollInner}
              keyboardShouldPersistTaps="handled"
            >
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
                  {selectedDiaryEvent.latitude !== undefined && selectedDiaryEvent.longitude !== undefined && (
                    <View style={styles.diaryLocationInfo}>
                      <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.diaryLocationText}>
                        {diaryEventAddress || `Lat: ${selectedDiaryEvent.latitude.toFixed(6)}, Long: ${selectedDiaryEvent.longitude.toFixed(6)}`}
                      </Text>
                    </View>
                  )}
                </View>
                
                {diaryEventRegion && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.modalInputLabel}>Location</Text>
                    <View style={styles.mapContainer}>
                      <MapView
                        style={styles.map}
                        initialRegion={diaryEventRegion}
                        provider={PROVIDER_GOOGLE}
                        customMapStyle={lightMode}
                        scrollEnabled={true}
                        zoomEnabled={true}
                      >
                        <Marker 
                          coordinate={{ 
                            latitude: selectedDiaryEvent.latitude, 
                            longitude: selectedDiaryEvent.longitude 
                          }} 
                          title={selectedDiaryEvent.title}
                          anchor={{ x: 0.5, y: 1 }}
                        >
                          <Image 
                            source={require("../../assets/icons/map-pin.png")} 
                            style={{ width: 32, height: 40 }}
                            resizeMode="contain"
                          />
                        </Marker>
                      </MapView>
                    </View>
                  </View>
                )}
                
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
                  <View style={styles.photoButtonContainer}>
                    <TouchableOpacity 
                      style={styles.photoButton} 
                      onPress={() => handlePickImage('library')}
                      disabled={uploadingPhoto}
                    >
                      <LinearGradient
                        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.photoButtonGradient}
                      >
                        <Ionicons name="image-outline" size={24} color="#ffffff" />
                        <Text style={styles.photoButtonText}>
                          {uploadingPhoto ? 'Uploading...' : 'Choose from Library'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.photoButton} 
                      onPress={() => handlePickImage('camera')}
                      disabled={uploadingPhoto}
                    >
                      <LinearGradient
                        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.photoButtonGradient}
                      >
                        <Ionicons name="camera-outline" size={24} color="#ffffff" />
                        <Text style={styles.photoButtonText}>Take Photo</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>

                {diaryPhotos.length > 0 && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.modalInputLabel}>Uploaded Photos ({diaryPhotos.length})</Text>
                    <FlatList
                      data={diaryPhotos}
                      horizontal
                      keyExtractor={(item, index) => `${item}-${index}`}
                      renderItem={({ item }) => (
                        <View style={styles.photoContainer}>
                          <TouchableOpacity
                            onPress={() => {
                              console.log('Image pressed:', item);
                              setSelectedPhotoUrl(item);
                              setShowPhotoViewer(true);
                            }}
                            activeOpacity={0.9}
                            style={{ width: 120, height: 120 }}
                          >
                            <Image 
                              source={{ uri: item }} 
                              style={styles.diaryPhoto}
                              onError={(error) => {
                                console.error('Error loading image:', item, error.nativeEvent.error);
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully:', item);
                              }}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deletePhotoButton}
                            onPress={() => handleDeletePhoto(item)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="close-circle" size={24} color="#ff3b30" />
                          </TouchableOpacity>
                        </View>
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
          </KeyboardAvoidingView>
          
          {/* Full-Screen Image Viewer Overlay - Inside diary modal */}
          <PhotoViewer
            visible={showPhotoViewer}
            imageUrl={selectedPhotoUrl}
            onClose={() => {
              console.log('Close button pressed');
              setShowPhotoViewer(false);
            }}
          />
        </LinearGradient>
      </Modal>

      {/* Event Modal */}
      <EventModal 
        visible={!!openEventId} 
        eventId={openEventId} 
        onClose={() => setOpenEventId(null)} 
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isVisible={showCreateEventModal}
        onClose={() => {
          setShowCreateEventModal(false);
          setCreateEventFromWishlist(null);
        }}
        onSuccess={() => {
          loadData(); // Refresh the data to show the new event
        }}
        initialTitle={createEventFromWishlist?.title}
        initialLocation={createEventFromWishlist?.location}
      />

      {/* Wishlist Item Modal */}
      <Modal visible={showWishlistModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => {
        setShowWishlistModal(false);
        setWishlistItemAddress(null);
      }}>
        <LinearGradient
          colors={['#6a5acd', '#00c6ff', '#9b59b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => {
              setShowWishlistModal(false);
              setWishlistItemAddress(null);
            }}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Wishlist Item</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.modalScrollContent} contentContainerStyle={styles.modalScrollInner}>
            {selectedWishlistItem && (
              <>
                <View style={styles.diaryEventInfo}>
                  <Text style={styles.diaryEventTitle}>{selectedWishlistItem.name}</Text>
                  {selectedWishlistItem.note && (
                    <Text style={styles.diaryEventDate}>{selectedWishlistItem.note}</Text>
                  )}
                  {selectedWishlistItem.created_at && (
                    <Text style={styles.diaryEventOrganizer}>
                      Added: {new Date(selectedWishlistItem.created_at).toLocaleDateString()}
                    </Text>
                  )}
                  {selectedWishlistItem.latitude !== undefined && selectedWishlistItem.longitude !== undefined && (
                    <View style={styles.diaryLocationInfo}>
                      <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.diaryLocationText}>
                        {wishlistItemAddress || `Lat: ${selectedWishlistItem.latitude.toFixed(6)}, Long: ${selectedWishlistItem.longitude.toFixed(6)}`}
                      </Text>
                    </View>
                  )}
                </View>
                
                {wishlistItemRegion && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.modalInputLabel}>Location</Text>
                    <View style={styles.mapContainer}>
                      <MapView
                        style={styles.map}
                        initialRegion={wishlistItemRegion}
                        provider={PROVIDER_GOOGLE}
                        customMapStyle={lightMode}
                        scrollEnabled={true}
                        zoomEnabled={true}
                      >
                        <Marker 
                          coordinate={{ 
                            latitude: selectedWishlistItem.latitude, 
                            longitude: selectedWishlistItem.longitude 
                          }} 
                          title={selectedWishlistItem.name}
                          anchor={{ x: 0.5, y: 1 }}
                        >
                          <Image 
                            source={require("../../assets/icons/map-pin.png")} 
                            style={{ width: 32, height: 40 }}
                            resizeMode="contain"
                          />
                        </Marker>
                      </MapView>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modalSubmitButton}
                  onPress={() => {
                    if (selectedWishlistItem) {
                      handleCreateEventFromWishlist(selectedWishlistItem);
                    }
                  }}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalSubmitGradient}
                  >
                    <Ionicons name="calendar-outline" size={16} color="#ffffff" />
                    <Text style={styles.modalSubmitText}>Create Event</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitButton}
                  onPress={() => {
                    Alert.alert(
                      'Delete Wishlist Item',
                      'Are you sure you want to delete this wishlist item?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            await handleDeleteWishlist(selectedWishlistItem.id);
                            setShowWishlistModal(false);
                          },
                        },
                      ]
                    );
                  }}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalSubmitGradient}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ffffff" />
                    <Text style={styles.modalSubmitText}>Delete</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 100, // 60px (tab bar) + 40px (padding)
  },
  tabContent: {
    flex: 1,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoItemSeparator: {
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
  photoButtonContainer: {
    gap: 12,
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
  photoContainer: {
    position: 'relative',
    marginRight: 12,
    width: 120,
    height: 120,
  },
  diaryPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
    zIndex: 10,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  map: {
    flex: 1,
  },
  diaryLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  diaryLocationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
});

