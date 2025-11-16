// src/screens/CropScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, CropRegion } from '../types';
import { CropBox } from '../components/CropBox';
import { ToggleButton } from '../components/ToggleButton';
import { BottomNavigation } from '../components/BottomNavigation';
import { cropDetectionService } from '../services/cropDetection';
import { imageProcessor } from '../services/imageProcessor';
import { logger } from '../services/logging';
import { COLORS } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Crop'>;
type RoutePropType = RouteProp<RootStackParamList, 'Crop'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const FOOTER_HEIGHT = 160;
const BOTTOM_NAV_HEIGHT = 90;

export default function CropScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { photoUri, dimensions } = route.params;

  const [autoMode, setAutoMode] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  
  const [cropRegion, setCropRegion] = useState<CropRegion>({
    x: dimensions.width * 0.1,
    y: dimensions.height * 0.25,
    width: dimensions.width * 0.8,
    height: dimensions.height * 0.35,
  });

  useEffect(() => {
    logger.navigationToScreen('CropScreen');
    
    // Set display dimensions to match the actual image container
    setDisplayDimensions({ 
      width: SCREEN_WIDTH, 
      height: SCREEN_HEIGHT - FOOTER_HEIGHT 
    });

    if (autoMode) {
      detectQuestion();
    }
  }, []);

  const detectQuestion = async () => {
    const detected = await cropDetectionService.detectQuestionBounds(photoUri, dimensions);
    if (detected) {
      setCropRegion(detected);
    }
  };

  const handleToggleMode = () => {
    const newMode = !autoMode;
    setAutoMode(newMode);
    logger.cropModeToggled(newMode);

    if (newMode) {
      detectQuestion();
    }
  };

  const handleRetake = () => {
    logger.retakePhotoTapped();
    navigation.goBack();
  };

  const handleConfirm = async () => {
    logger.confirmCropTapped(cropRegion);
    setIsProcessing(true);

    try {
      const croppedUri = await imageProcessor.cropImage(photoUri, cropRegion, dimensions);
      navigation.navigate('Preview', { croppedUri });
    } catch (error) {
      logger.cameraError(error as Error, 'cropImage');
      Alert.alert('Error', 'Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGalleryPress = () => {
    Alert.alert('Gallery', 'Gallery picker coming soon!');
  };

  const handleMicPress = () => {
    Alert.alert('Voice Input', 'Voice input coming soon!');
  };

  const handleNavigation = (route: 'search' | 'camera' | 'profile') => {
    if (route === 'search') {
      navigation.navigate('Search' as never);
    } else if (route === 'camera') {
      navigation.navigate('Camera' as never);
    } else if (route === 'profile') {
      navigation.navigate('Profile' as never);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleRetake}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.brandContainer}>
          <Text style={styles.brandEmoji}>🎁</Text>
          <Text style={styles.brandText}>Get pro</Text>
        </View>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: photoUri }} 
          style={styles.image}
          resizeMode="cover"
        />
        {displayDimensions.width > 0 && (
          <CropBox
            cropRegion={cropRegion}
            onCropChange={setCropRegion}
            imageDimensions={dimensions}
            displayDimensions={displayDimensions}
            maxHeight={dimensions.height}
          />
        )}
      </View>

      {/* Footer - Same as CameraScreen */}
      <View style={styles.footerWrapper}>
        {/* Gradient overlay with rounded top border */}
        <View style={styles.gradientOverlay}>
          <View style={styles.gradientTop} />
          <View style={styles.gradientMiddle} />
          <View style={styles.gradientBottom} />
        </View>

        {/* Capture/Confirm Buttons */}
        <View style={styles.captureContainer}>
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
            disabled={isProcessing}
          >
            <View style={styles.outerRing}>
              <View style={styles.middleRing}>
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <View style={styles.innerCircle}>
                    <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                  </View>
                )}
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
  topGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    zIndex: 1,
  },
  topGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#000000',
  },
  topGradientBottom: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: FOOTER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - FOOTER_HEIGHT,
    backgroundColor: '#1a1a1a',
  },
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: FOOTER_HEIGHT,
    zIndex: 999,
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
    backgroundColor: 'rgba(6, 194, 31, 0)',
    zIndex: -1,
  },
  gradientMiddle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(167, 201, 17, 0)',
    zIndex: -1,
  },
  gradientBottom: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    bottom: -90,
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#ffffff',
    zIndex: -1,
  },
  captureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 0,
    paddingBottom: 80,
    zIndex: 10,
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