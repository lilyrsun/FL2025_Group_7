import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Props = {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
};

const PhotoViewer: React.FC<Props> = ({ visible, imageUrl, onClose }) => {
  const [imageSize, setImageSize] = useState({ width: screenWidth, height: screenHeight });

  if (!visible || !imageUrl) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" translucent />
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
      >
        <Ionicons name="close" size={32} color="#ffffff" />
      </TouchableOpacity>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        minimumZoomScale={1}
        maximumZoomScale={5}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bouncesZoom={true}
        scrollEventThrottle={16}
        centerContent={true}
      >
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: imageSize.width, height: imageSize.height }]}
          resizeMode="contain"
          onError={(error) => {
            console.error('Error loading full-screen image:', error);
          }}
          onLoad={(event) => {
            console.log('Full-screen image loaded successfully');
            const { width, height } = event.nativeEvent.source;
            if (width && height) {
              const imageAspectRatio = width / height;
              const screenAspectRatio = screenWidth / screenHeight;
              
              let imageWidth = screenWidth;
              let imageHeight = screenHeight;
              
              if (imageAspectRatio > screenAspectRatio) {
                // Image is wider - fit to width
                imageHeight = screenWidth / imageAspectRatio;
              } else {
                // Image is taller - fit to height
                imageWidth = screenHeight * imageAspectRatio;
              }
              
              setImageSize({ width: imageWidth, height: imageHeight });
            }
          }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1001,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: screenWidth,
    minHeight: screenHeight,
  },
  image: {
    // Dimensions will be set dynamically based on image aspect ratio
  },
});

export default PhotoViewer;

