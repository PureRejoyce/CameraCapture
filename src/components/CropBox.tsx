// src/components/CropBox.tsx (Fixed - Proper Delta Handling)
import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { CropRegion, ImageDimensions } from '../types';
import { CropHandles } from './CropHandles';
import { constrainCropRegion } from '../utils/imageUtils';
import { CONSTANTS, COLORS } from '../utils/constants';
import { logger } from '../services/logging';

interface CropBoxProps {
  cropRegion: CropRegion;
  onCropChange: (region: CropRegion) => void;
  imageDimensions: ImageDimensions;
  displayDimensions: ImageDimensions;
  maxHeight?: number;
}

export const CropBox: React.FC<CropBoxProps> = ({
  cropRegion,
  onCropChange,
  imageDimensions,
  displayDimensions,
  maxHeight,
}) => {
  const scale = displayDimensions.width / imageDimensions.width;
  const lastTranslation = useRef({ x: 0, y: 0 });

  const panGesture = Gesture.Pan()
    .minDistance(5)
    .onStart(() => {
      lastTranslation.current = { x: 0, y: 0 };
    })
    .onUpdate((event) => {
      const deltaX = (event.translationX - lastTranslation.current.x) / scale;
      const deltaY = (event.translationY - lastTranslation.current.y) / scale;

      lastTranslation.current = {
        x: event.translationX,
        y: event.translationY
      };

      const newRegion: CropRegion = {
        x: cropRegion.x + deltaX,
        y: cropRegion.y + deltaY,
        width: cropRegion.width,
        height: cropRegion.height,
      };

      const constrained = constrainCropRegion(
        newRegion,
        imageDimensions,
        CONSTANTS.MIN_CROP_SIZE,
        maxHeight
      );

      if (constrained.x !== cropRegion.x || constrained.y !== cropRegion.y) {
        logger.cropBoxDragged({ x: constrained.x, y: constrained.y });
        onCropChange(constrained);
      }
    })
    .onEnd(() => {
      lastTranslation.current = { x: 0, y: 0 };
    });

  const handleResize = (corner: string, deltaX: number, deltaY: number) => {
    const newRegion = { ...cropRegion };

    switch (corner) {
      case 'topLeft':
        newRegion.x += deltaX / scale;
        newRegion.y += deltaY / scale;
        newRegion.width -= deltaX / scale;
        newRegion.height -= deltaY / scale;
        break;
      case 'topRight':
        newRegion.y += deltaY / scale;
        newRegion.width += deltaX / scale;
        newRegion.height -= deltaY / scale;
        break;
      case 'bottomLeft':
        newRegion.x += deltaX / scale;
        newRegion.width -= deltaX / scale;
        newRegion.height += deltaY / scale;
        break;
      case 'bottomRight':
        newRegion.width += deltaX / scale;
        newRegion.height += deltaY / scale;
        break;
    }

    const constrained = constrainCropRegion(
      newRegion,
      imageDimensions,
      CONSTANTS.MIN_CROP_SIZE,
      maxHeight
    );

    logger.cropBoxResized(constrained);
    onCropChange(constrained);
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: displayDimensions.width,
          height: displayDimensions.height,
        },
      ]}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={panGesture}>
        <View
          style={[
            styles.cropBox,
            {
              transform: [
                { translateX: cropRegion.x * scale },
                { translateY: cropRegion.y * scale },
              ],
              width: cropRegion.width * scale,
              height: cropRegion.height * scale,
            }
          ]}
        >
          <View style={styles.border} />
          <View style={styles.corners}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <CropHandles onResize={handleResize} />
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: CONSTANTS.CROP_BORDER_WIDTH,
    borderColor: COLORS.cropBox,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  corners: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.white,
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
});
