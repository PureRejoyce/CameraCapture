// src/screens/CameraScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Alert, Image, Dimensions, Platform } from 'react-native';
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

// Footer includes gradient (60px) + buttons (70px) + bottom nav (90px) = 220px total
const FOOTER_HEIGHT = 250;
const BOTTOM_NAV_HEIGHT = 90;

// This is the area where crop box can move
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - FOOTER_HEIGHT;


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

  // Initialize crop box with proper dimensions when photo is captured
  useEffect(() => {
    if (capturedPhoto) {
      // Calculate display dimensions that fit in available height
      const aspectRatio = capturedPhoto.dimensions.width / capturedPhoto.dimensions.height;
      let displayWidth = SCREEN_WIDTH;
      let displayHeight = SCREEN_WIDTH / aspectRatio;

      // If image is too tall, constrain by height instead
      if (displayHeight > AVAILABLE_HEIGHT) {
        displayHeight = AVAILABLE_HEIGHT;
        displayWidth = displayHeight * aspectRatio;
      }

      setDisplayDimensions({ width: displayWidth, height: displayHeight });

      // Set initial crop box size - smaller than before (60% of image)
      const cropWidth = capturedPhoto.dimensions.width * 0.6;
      const cropHeight = capturedPhoto.dimensions.height * 0.4;
      
      // Center the crop box initially
      const cropX = (capturedPhoto.dimensions.width - cropWidth) / 2;
      const cropY = (capturedPhoto.dimensions.height - cropHeight) / 2;

      setCropRegion({
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
      });
    }
  }, [capturedPhoto]);

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

        // Set captured photo state to show crop UI
        setCapturedPhoto({
          uri: photo.uri,
          dimensions: { width: photo.width, height: photo.height }
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
      initialCropRegion: cropRegion,
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
      {/* Preview Area - properly constrained to AVAILABLE_HEIGHT */}
      <View style={[styles.previewArea, { height: AVAILABLE_HEIGHT }]}>
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
                style={[
                  styles.capturedImage,
                  {
                    width: displayDimensions.width,
                    height: displayDimensions.height,
                  }
                ]}
                resizeMode="contain"
              />
              {displayDimensions.width > 0 && displayDimensions.height > 0 && (
                <CropBox
                  cropRegion={cropRegion}
                  onCropChange={setCropRegion}
                  imageDimensions={capturedPhoto.dimensions}
                  displayDimensions={displayDimensions}
                  maxHeight={AVAILABLE_HEIGHT}
                />
              )}
            </View>
          </View>
        )}
      </View>

      {/* Footer - Always visible at bottom, fixed height */}
      <View style={[styles.footerWrapper, { height: FOOTER_HEIGHT }]}>
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
    width: '100%',
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  capturedPhotoWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  capturedImage: {
    backgroundColor: '#1a1a1a',
  },
  footerWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
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
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  gradientMiddle: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  gradientBottom: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#ffffff',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 15,
  },
  centerContent: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
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
    paddingTop: 80,
    paddingBottom: 10,
    zIndex: 8,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});