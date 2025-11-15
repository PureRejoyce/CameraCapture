// src/components/BottomNavigation.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavigationProps {
  currentRoute: 'search' | 'camera' | 'profile';
  onNavigate: (route: 'search' | 'camera' | 'profile') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const getIconColor = (route: 'search' | 'camera' | 'profile') => {
    return currentRoute === route ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
  };

  return (
   <View style={styles.wrapper}>
      
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate('search')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="search-outline"
              size={24}
              color={getIconColor('search')}
            />
          </TouchableOpacity>

          <View style={styles.cameraContainer}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => onNavigate('camera')}
              activeOpacity={0.7}
            >
              <View style={styles.cameraIconWrapper}>
                <View style={[
                  styles.cameraIconBackground,
                  currentRoute === 'camera' && styles.cameraIconBackgroundActive
                ]}>
                  <Ionicons
                    name="camera-outline"
                    size={26}
                    color={currentRoute === 'camera' ? "#007AFF" : "#FFFFFF"}
                  />
                </View>
              </View>
            </TouchableOpacity>
            {currentRoute === 'camera' && <View style={styles.cameraIndicator} />}
          </View>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate('profile')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-outline"
              size={24}
              color={getIconColor('profile')}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    position: 'relative',
    backgroundColor: 'black', // THIS IS THE BLACK YOU SEE!
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(29, 172, 10, 0.1)',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    zIndex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  navItem: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  cameraContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  cameraButton: {
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  cameraIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 40,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  cameraIconBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconBackgroundActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
});