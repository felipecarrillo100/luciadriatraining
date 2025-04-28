import { getReference } from '@luciad/ria/reference/ReferenceProvider.js';
import { WebGLMap } from '@luciad/ria/view/WebGLMap.js';
import { Bounds } from '@luciad/ria/shape/Bounds.js';
import { createBounds } from '@luciad/ria/shape/ShapeFactory.js';
import { Point } from '@luciad/ria/shape/Point.js';
import { AnimationManager } from '@luciad/ria/view/animation/AnimationManager.js';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera.js';
import { createTransformation } from '@luciad/ria/transformation/TransformationFactory.js';
import { Handle } from '@luciad/ria/util/Evented.js';
import {CRSEnum} from '../interfaces/CRS.enum';
import {Move3DCameraAnimation} from '../controllers/panocontroller/animation/Move3DCameraAnimation';
import {MapViewMode} from '../interfaces/main-map.interface';

const MAP_STATE_STORAGE = 'map-state';
const MAP_VIEW_STORAGE = 'map-view';
const MAP_CAMERA_OBSERVER_MODE_STATE_STORAGE = 'cameraObserverModeTriggerState';
const MAP_CAMERA_ORBIT_MODE_STATE_STORAGE = 'cameraOrbitModeTriggerState';

const CUSTOM_NEAR_PLANE = 0.1;
const HEIGHT_THRESHOLD = 100.0;

export interface MapCreationOptions {
  element: HTMLDivElement;
  mode: MapViewMode;
}

export class MapFactory {
  private static _cameraNear = CUSTOM_NEAR_PLANE; // Initial value
  private static _cameraRestrictionsMapChangeHandler: Handle;

  public static create2DMap(element: HTMLDivElement) {
    const WebMercator = CRSEnum.EPSG_3857;
    const reference = getReference(WebMercator);
    const newMap = new WebGLMap(element, { reference, wrapAroundWorld: true });

    MapFactory.setCameraRestrictions(newMap);
    return newMap;
  }

  public static create3DMap(element: HTMLDivElement) {
    const Map3D = CRSEnum.EPSG_4978;
    const reference = getReference(Map3D);
    const newMap = new WebGLMap(element, { reference });

    MapFactory.setCameraRestrictions(newMap);
    return newMap;
  }

  public static createMap(options: MapCreationOptions) {
    if (options.mode === MapViewMode['2D']) {
      return MapFactory.create2DMap(options.element);
    }

    return MapFactory.create3DMap(options.element);
  }

  public static standardizeBounds(bounds: Bounds | Point) {
    const step = 0.001;

    if (bounds instanceof Bounds) {
      const dimensions = { x: bounds.x, width: bounds.width, y: bounds.y, height: bounds.height };

      if (dimensions.width === 0) {
        dimensions.width = step;
        dimensions.x = bounds.x - step / 2;
      }

      if (dimensions.height === 0) {
        dimensions.height = step;
        dimensions.y = bounds.y - step / 2;
      }

      return createBounds(bounds.reference, [dimensions.x, dimensions.width, dimensions.y, dimensions.height]);
    } else {
      const dimensions = { x: bounds.x, width: 0, y: bounds.y, height: 0 };

      if (dimensions.width === 0) {
        dimensions.width = step;
        dimensions.x = bounds.x - step / 2;
      }

      if (dimensions.height === 0) {
        dimensions.height = step;
        dimensions.y = bounds.y - step / 2;
      }

      return createBounds(bounds.reference, [dimensions.x, dimensions.width, dimensions.y, dimensions.height]);
    }
  }

  public static setMapView = (mode: string) => {
    let mapViewMode = MapViewMode['3D'];
    if (mode === MapViewMode['2D']) mapViewMode = MapViewMode['2D'];
    if (mode === MapViewMode['3D']) mapViewMode = MapViewMode['3D'];

    sessionStorage.setItem(MAP_VIEW_STORAGE, mapViewMode);
  };

  public static getMapView = (): MapViewMode => {
    const mapView = sessionStorage.getItem(MAP_VIEW_STORAGE) as MapViewMode;
    return mapView ? mapView : MapViewMode['3D'];
  };

  // UNUSED
  public static removeMapView = () => {
    sessionStorage.removeItem(MAP_VIEW_STORAGE);
  };

  public static setMapState(state: unknown) {
    sessionStorage.setItem(MAP_STATE_STORAGE, JSON.stringify(state));
  }

  public static getMapState() {
    const stateStr = sessionStorage.getItem(MAP_STATE_STORAGE);
    return stateStr ? JSON.parse(stateStr) : null;
  }

  public static removeMapState() {
    // @ts-ignore
    sessionStorage.setItem(MAP_STATE_STORAGE, null);
    sessionStorage.removeItem(MAP_STATE_STORAGE);
  }

  public static animateZoomOut(map: WebGLMap, duration = 500) {
    return MapFactory.moveCameraToPoint(map, map.camera.eyePoint, duration, {
      // @ts-ignore
      yaw: undefined,
      pitch: -89.99,
      // @ts-ignore
      roll: undefined,
    });
  }

  private static setCameraRestrictions(map: WebGLMap) {
    if (map.mapNavigator.constraints.above) {
      map.mapNavigator.constraints.above.minAltitude = 0.5;
    }

    const transformation = createTransformation(map.reference, getReference(CRSEnum.CRS_84));

    const defineCameraNear = () => {
      const height = transformation.transform(map.camera.eyePoint).z;
      const nearRawValue = height > HEIGHT_THRESHOLD ? height * 0.01 : CUSTOM_NEAR_PLANE;
      const near = Math.round(nearRawValue * 100) / 100; // Round to 2 decimal places

      if (near !== this._cameraNear) {
        map.camera = map.camera.copyAndSet({ near });
      }

      this._cameraNear = near;
    };

    map.adjustDepthRange = false;
    map.camera = map.camera.copyAndSet({ near: CUSTOM_NEAR_PLANE });

    this._cameraRestrictionsMapChangeHandler?.remove();
    this._cameraRestrictionsMapChangeHandler = map.on('MapChange', defineCameraNear);
  }

  private static moveCameraToPoint(
    map: WebGLMap,
    point: Point,
    duration: number,
    view: { yaw: number; pitch: number; roll: number },
  ): Promise<void> {
    const lookFrom = (map.camera as PerspectiveCamera).asLookFrom();
    const moveToAnimation = new Move3DCameraAnimation(
      map,
      point,
      typeof view.yaw !== 'undefined' ? view.yaw : lookFrom.yaw,
      typeof view.pitch !== 'undefined' ? view.pitch : lookFrom.pitch,
      typeof view.roll !== 'undefined' ? view.roll : lookFrom.roll,
      (map.camera as PerspectiveCamera).fovY,
      duration,
    );
    // @ts-ignore
    return AnimationManager.putAnimation(map.cameraAnimationKey, moveToAnimation, false);
  }

  public static setCameraObserverModeTriggerState(triggeredFromCameraMode: boolean) {
    sessionStorage.setItem(MAP_CAMERA_OBSERVER_MODE_STATE_STORAGE, JSON.stringify(triggeredFromCameraMode));
  }

  public static getCameraObserverModeTriggerState() {
    const cameraObserverMode = sessionStorage.getItem(MAP_CAMERA_OBSERVER_MODE_STATE_STORAGE);
    return cameraObserverMode ? JSON.parse(cameraObserverMode) : null;
  }

  public static removeCameraObserverModeTriggerState() {
    // @ts-ignore
    sessionStorage.setItem(MAP_CAMERA_OBSERVER_MODE_STATE_STORAGE, null);
    sessionStorage.removeItem(MAP_CAMERA_OBSERVER_MODE_STATE_STORAGE);
  }

  public static setCameraOrbitModeTriggerState(triggeredFromCameraMode: boolean) {
    sessionStorage.setItem(MAP_CAMERA_ORBIT_MODE_STATE_STORAGE, JSON.stringify(triggeredFromCameraMode));
  }

  public static getCameraOrbitModeTriggerState() {
    const cameraOrbitMode = sessionStorage.getItem(MAP_CAMERA_ORBIT_MODE_STATE_STORAGE);
    return cameraOrbitMode ? JSON.parse(cameraOrbitMode) : null;
  }

  public static removeCameraOrbitModeTriggerState() {
    // @ts-ignore
    sessionStorage.setItem(MAP_CAMERA_ORBIT_MODE_STATE_STORAGE, null);
    sessionStorage.removeItem(MAP_CAMERA_ORBIT_MODE_STATE_STORAGE);
  }
}
