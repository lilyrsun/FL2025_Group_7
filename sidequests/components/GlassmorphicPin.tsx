import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';

type GlassmorphicPinProps = {
  location: Location.LocationObjectCoords;
};

const GlassmorphicPin: React.FC<GlassmorphicPinProps> = ({ location }) => {
  return (
    <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }}>
      <BlurView intensity={50} tint="light" style={styles.glassPin}>
        {/* <Text style={styles.pinText}>🎉</Text> */}
      </BlurView>
    </Marker>
  );
};

export default GlassmorphicPin;

const styles = StyleSheet.create({
  glassPin: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pinText: {
    fontSize: 20,
  },
});