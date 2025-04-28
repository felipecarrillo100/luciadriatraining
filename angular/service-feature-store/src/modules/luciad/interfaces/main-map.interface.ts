export interface MaiMapCameraSettings {
  epsg: string;
  point: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    roll: number;
    yaw: number;
    pitch: number;
  };
}

export enum MapViewMode {
  '2D' = '2d',
  '3D' = '3d',
}
