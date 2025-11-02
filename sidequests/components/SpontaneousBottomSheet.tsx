import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_API_URL } from '@env';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
};

const SpontaneousBottomSheet: React.FC<Props> = ({
  isVisible,
  onClose,
  isActive,
  onStart,
  onStop,
}) => {
  const [statusText, setStatusText] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const bottomSheetRef = useRef<BottomSheet>(null);

  console.log('SpontaneousBottomSheet render - isVisible:', isVisible);

  // Control visibility via index prop and also imperatively expand/close for reliability
  useEffect(() => {
    console.log('SpontaneousBottomSheet useEffect - isVisible changed to:', isVisible);
    if (isVisible) {
      console.log('Expanding SpontaneousBottomSheet');
      bottomSheetRef.current?.expand();
    } else {
      console.log('Closing SpontaneousBottomSheet');
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

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
      const response = await fetch(`${BACKEND_API_URL}/spontaneous/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to stop spontaneous event');
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

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={['60%']}
      enablePanDownToClose
      onClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {isActive ? 'Stop Sharing Location' : 'Start Spontaneous Event'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {!isActive ? (
          <View style={styles.content}>
            <Text style={styles.subtitle}>
              Share your location with friends and let them know you're available!
            </Text>

            <Text style={styles.label}>Status (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Down for coffee!"
              value={statusText}
              onChangeText={setStatusText}
              maxLength={100}
              multiline
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                Your location will be shared for 10 minutes and only visible to friends.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={handleStart}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.buttonText}>Starting...</Text>
              ) : (
                <>
                  <Ionicons name="radio-button-on" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Start Sharing</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.activeStatus}>
              <Ionicons name="radio-button-on" size={32} color="#4CAF50" />
              <Text style={styles.activeText}>Location is being shared</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Your friends can see your live location and join you.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStop}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.buttonText}>Stopping...</Text>
              ) : (
                <>
                  <Ionicons name="stop-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Stop Sharing</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 50,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
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
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
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
    color: '#4CAF50',
  },
});

export default SpontaneousBottomSheet;

