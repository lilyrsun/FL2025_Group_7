import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_API_URL } from '@env';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
};

const SpontaneousModal: React.FC<Props> = ({
  isVisible,
  onClose,
  isActive,
  onStart,
  onStop,
}) => {
  const [statusText, setStatusText] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const handleStart = async () => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      // Request location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required for spontaneous events');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude, accuracy } = location.coords;

      const response = await fetch(`${BACKEND_API_URL}/spontaneous/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          status_text: statusText || 'Available for a spontaneous hangout!',
          latitude,
          longitude,
          accuracy,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start spontaneous event');
      }

      onStart();
      onClose();
    } catch (error) {
      console.error('Error starting spontaneous event:', error);
      alert('Failed to start spontaneous event');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      if (!BACKEND_API_URL) {
        console.warn('BACKEND_API_URL not configured');
      }

      const url = `${BACKEND_API_URL}/spontaneous/stop`;
      console.log('Stopping spontaneous presence via:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        // If no active presence exists anymore (already expired/stopped), treat as success
        if (response.status === 404) {
          console.log('No active presence to stop; treating as already stopped');
        } else {
          const text = await response.text();
          console.error('Stop spontaneous failed:', response.status, text);
          throw new Error('Failed to stop spontaneous event');
        }
      }

      onStop();
      onClose();
    } catch (error) {
      console.error('Error stopping spontaneous event:', error);
      alert('Failed to stop spontaneous event');
    } finally {
      setLoading(false);
    }
  };

  console.log('SpontaneousModal render - isVisible:', isVisible);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['#6a5acd', '#00c6ff', '#9b59b6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modalGradient}
        >
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          
          {/* Modal Header */}
          <View style={[styles.modalHeader, { paddingTop: insets.top + 4 }]}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{isActive ? 'Stop Sharing' : 'Start Spontaneous'}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Modal Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.container}
            >
                {!isActive ? (
                  <View style={styles.content}>
                    <Text style={styles.subtitleLight}>
                      Share your location with friends and let them know you're available!
                    </Text>

                    <Text style={styles.labelLight}>Status (optional)</Text>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                      style={styles.inputGradient}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., Down for coffee!"
                        placeholderTextColor="rgba(106, 90, 205, 0.6)"
                        value={statusText}
                        onChangeText={setStatusText}
                        maxLength={100}
                        multiline
                      />
                    </LinearGradient>

                    <View style={styles.infoBoxLight}>
                      <Ionicons name="information-circle-outline" size={20} color="#ffffff" />
                      <Text style={styles.infoTextLight}>
                        Your location will be shared for 10 minutes and only visible to friends.
                      </Text>
                    </View>

                    <TouchableOpacity onPress={handleStart} disabled={loading}>
                      <LinearGradient
                        colors={loading ? ['#a8a8a8', '#888888'] : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.buttonSurface, styles.startSurface]}
                      >
                        <Ionicons name="radio-button-on" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Start Sharing</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.content}>
                    <View style={styles.activeStatus}>
                      <Ionicons name="radio-button-on" size={32} color="#B7F5C8" />
                      <Text style={styles.activeText}>Location is being shared</Text>
                    </View>

                    <View style={styles.infoBoxLight}>
                      <Text style={styles.infoTextLight}>
                        Your friends can see your live location and join you.
                      </Text>
                    </View>

                    <TouchableOpacity onPress={handleStop} disabled={loading}>
                      <LinearGradient
                        colors={loading ? ['#a8a8a8', '#888888'] : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.buttonSurface, styles.stopSurface]}
                      >
                        <Ionicons name="stop-circle" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Stop Sharing</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
          </KeyboardAvoidingView>
        </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalGradient: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '90%',
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  subtitleLight: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 20,
  },
  labelLight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  inputGradient: {
    borderRadius: 12,
    padding: 2,
    marginBottom: 20,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 50,
    color: '#2d2d2d',
    backgroundColor: 'transparent',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoBoxLight: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  infoTextLight: {
    fontSize: 13,
    color: '#ffffff',
    marginLeft: 10,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  startSurface: {
  },
  stopSurface: {
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    gap: 12,
  },
  activeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B7F5C8',
  },
});

export default SpontaneousModal;
