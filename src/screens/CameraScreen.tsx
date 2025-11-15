// src/screens/CameraScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Alert, Image, Dimensions } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, CropRegion, ImageDimensions } from '../types';
import { logger } from '../services/logging';
import { COLORS } from '../utils/constants';
import { BottomNavigation } from '../components/BottomNavigation';
import { Ionicons } from '@expo/vector-icons';
import { CropBox } from '../components/CropBox';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const FOOTER_HEIGHT = 160; // Total height of gradient + capture buttons + bottom nav
const BOTTOM_NAV_HEIGHT = 90; // Height of BottomNavigation component

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<{ uri: string; dimensions: ImageDimensions } | null>(null);
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  const [cropRegion, setCropRegion] = useState<CropRegion>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const cameraRef = useRef<Camera>(null);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        logger.cameraInitialized({ granted: true });
      } else {
        logger.cameraPermissionDenied();
      }
    })();
  }, []);

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need camera permission to continue</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
            if (status !== 'granted') {
              logger.cameraPermissionDenied();
            }
          }}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    logger.photoCaptureTapped();
    logger.photoCaptureStart();

    try {
      if (!cameraRef.current) return;

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
      });

      if (photo) {
        logger.photoCaptured(photo.uri, { 
          width: photo.width, 
          height: photo.height 
        });
        logger.photoCaptureEnd();

        // Navigate directly to Crop screen after taking picture
        navigation.navigate('Crop', {
          photoUri: photo.uri,
          dimensions: { width: photo.width, height: photo.height },
        });
      }
    } catch (error) {
      logger.cameraError(error as Error, 'takePictureAsync');
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const handleGalleryPress = () => {
    Alert.alert('Gallery', 'Gallery picker coming soon!\n\nInstall expo-image-picker to enable this feature.');
  };

  const handleMicPress = () => {
    Alert.alert('Voice Input', 'Voice input coming soon!\n\nInstall expo-av to enable voice recording.');
  };

  const handleRetake = () => {
    logger.retakePhotoTapped();
    setCapturedPhoto(null);
    setCropRegion({ x: 0, y: 0, width: 0, height: 0 });
    setDisplayDimensions({ width: 0, height: 0 });
  };

  const handleConfirm = () => {
    if (!capturedPhoto) return;
    logger.confirmCropTapped(cropRegion);
    navigation.navigate('Crop', {
      photoUri: capturedPhoto.uri,
      dimensions: capturedPhoto.dimensions,
    });
  };

  const handleNavigation = (route: 'search' | 'camera' | 'profile') => {
    if (route === 'search') {
      navigation.navigate('Search');
    } else if (route === 'profile') {
      navigation.navigate('Profile');
    }
  };

  return (
    <View style={styles.container}>
      {/* Preview Area - constrained to not overlap footer */}
      <View style={styles.previewArea}>
        {!capturedPhoto ? (
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={CameraType.back}
          >
            <View style={styles.topBar}>
              <View style={styles.brandContainer}>
                <Text style={styles.brandEmoji}>🎁</Text>
                <Text style={styles.brandText}>Get pro</Text>
              </View>
            </View>

            <View style={styles.centerContent}>
              <Text style={styles.instructionText}>Take a pic and get{'\n'}an answer</Text>
            </View>
          </Camera>
        ) : (
          <View style={styles.capturedPhotoWrapper}>
            <View style={styles.topBar}>
              <View style={styles.brandContainer}>
                <Text style={styles.brandEmoji}>🎁</Text>
                <Text style={styles.brandText}>Get pro</Text>
              </View>
            </View>

            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: capturedPhoto.uri }} 
                style={styles.capturedImage}
                resizeMode="cover"
              />
              {capturedPhoto && (
                <CropBox
                  cropRegion={cropRegion}
                  onCropChange={setCropRegion}
                  imageDimensions={capturedPhoto.dimensions}
                  displayDimensions={{
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT - FOOTER_HEIGHT
                  }}
                />
              )}
            </View>
          </View>
        )}
      </View>

      {/* Footer - Always visible, never overlapped */}
      <View style={styles.footerWrapper}>
        {/* Gradient overlay with rounded top border */}
        <View style={styles.gradientOverlay}>
          <View style={styles.gradientTop} />
          <View style={styles.gradientMiddle} />
          <View style={styles.gradientBottom} />
        </View>

        {/* Capture/Confirm Buttons */}
        <View style={styles.captureContainer}>
          {!capturedPhoto ? (
            <>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleGalleryPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconButtonInner}>
                  <Ionicons name="images-outline" size={28} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={takePicture}
                activeOpacity={0.7}
              >
                <View style={styles.outerRing}>
                  <View style={styles.middleRing}>
                    <View style={styles.innerCircle} />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleMicPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconButtonInner}>
                  <Ionicons name="mic-outline" size={28} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleRetake}
                activeOpacity={0.7}
              >
                <View style={styles.iconButtonInner}>
                  <Ionicons name="close" size={32} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.7}
              >
                <View style={styles.outerRing}>
                  <View style={styles.middleRing}>
                    <View style={styles.innerCircle}>
                      <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleMicPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconButtonInner}>
                  <Ionicons name="mic-outline" size={28} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        <BottomNavigation
          currentRoute="camera"
          onNavigate={handleNavigation}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  message: {
    textAlign: 'center',
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  previewArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: FOOTER_HEIGHT,
    backgroundColor: COLORS.background,
  },
  camera: {
    flex: 1,
  },
  capturedPhotoWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5, // Higher priority than content overlays
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: FOOTER_HEIGHT,
    zIndex: 10, // Lower z-index than image container
    backgroundColor: 'transparent',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0,
    backgroundColor: 'rgba(6, 194, 31, 0)', // Fully transparent at top
    zIndex: -1, // Keep gradients behind content
  },
  gradientMiddle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(167, 201, 17, 0)', // Semi-transparent fade
    zIndex: -1, // Keep gradients behind content
  },
  gradientBottom: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    bottom: -90,
    backgroundColor: '#000000', // Solid black for buttons and nav
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#ffffffff', // WHITE BORDER LINE - now at 60px
    zIndex: -1, // Ensure gradient stays behind other content
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 15, // Higher than image container to stay visible
  },
  centerContent: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100, // Highest priority for instructional text overlay
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  brandEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  brandText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  instructionText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  captureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 0, // Space from top of footer to buttons (includes gradient area)
    paddingBottom: -20,
    zIndex: 8, // Set below footer wrapper to stay within bounds
    backgroundColor: 'transparent',
  },
  iconButton: {
    width: 62.5,
    height: 62.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
  },
  iconButtonInner: {
    width: 62.5,
    height: 62.5,
    borderRadius: 31.25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: 'transparent',
  },
  middleRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#5FA8A8',
  },
});