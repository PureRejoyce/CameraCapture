export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface PhotoData {
  uri: string;
  width: number;
  height: number;
}

export type RootStackParamList = {
  Camera: undefined;
  Crop: {
    photoUri: string;
    dimensions: ImageDimensions;
  };
  Preview: {
    croppedUri: string;
  };
  Search: undefined;
  Profile: undefined;
};