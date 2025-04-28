import {ElementRef, Injectable } from '@angular/core';
import {getReference} from '@luciad/ria/reference/ReferenceProvider.js';
import { CRSEnum } from '../../modules/luciad/interfaces/CRS.enum';
import { GeoJsonCodec } from '@luciad/ria/model/codec/GeoJsonCodec.js';
import { WebGLMap } from '@luciad/ria/view/WebGLMap.js';
import { Point } from '@luciad/ria/shape/Point.js';
import {ContextMenu} from '@luciad/ria/view/ContextMenu.js';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import { LuciadMapComponent } from '../components/luciad-map/luciad-map.component';
import {SelectionChangeInfo} from '@luciad/ria/view/Map.js';
import {createPoint} from '@luciad/ria/shape/ShapeFactory.js';
import {Shape} from '@luciad/ria/shape/Shape.js';
import {ShapeType} from '@luciad/ria/shape/ShapeType.js';
import {Polygon} from '@luciad/ria/shape/Polygon.js';
import {MapFactory} from '../../modules/luciad/factories/MapFactory.js';
import GeoTools from '../../modules/luciad/utils/GeoTools';
import {fitMapToBounds} from '../../modules/luciad/utils/FitMapToBounds';
import {
  ContextMenuGenerator,
  ContextMenuOnClosestSurfaceControllerEvent
} from '../../modules/luciad/controllers/firstperson/modularcontrollers/MouseButtonsController';

const CRS84 = getReference(CRSEnum.EPSG_4326);
const decoder = new GeoJsonCodec({ generateIDs: true });

interface MaiMapCameraSettings {
  epsg?: string;
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

export interface MaiMapCamera2DSettings {
  epsg?: string;
  transformation2D: {
    worldOrigin: number[];
    viewOrigin: number[];
    scale: number[];
    rotation: number;
  };
  viewSize: number[];
}

interface SaveState {
  transformation3D: {
    eyePointX: number;
    eyePointY: number;
    eyePointZ: number;
    yaw: number;
    pitch: number;
    roll: number;
  };
  transformation2D: {
    worldOrigin: number[];
    viewOrigin: number[];
    scale: number[];
    rotation: number;
  };
  viewSize: number[];
  reference: string;
}

export interface WebGLMapExtended extends WebGLMap {
  onMouseClick: (point: Point) => void;
  contextMenuFromMap: ContextMenu | ContextMenuGenerator;
  onCreateCustomContextMenu: (event: ContextMenuOnClosestSurfaceControllerEvent) => void;
}

@Injectable({
  providedIn: 'root',
})
export class MainMapService {
  private subjectMap = new BehaviorSubject<WebGLMap | null>(null);
  private subjectMapComponent = new BehaviorSubject<LuciadMapComponent | null>(null);
  private subjectContextMenu = new BehaviorSubject<ContextMenu | ContextMenuGenerator | null>(null);
  private subjectPointClick = new Subject<Point>();
  private subjectSelectionChange = new Subject<SelectionChangeInfo[]>();
  private mapContainerSubject = new BehaviorSubject<ElementRef | null>(null);

  private _silentUpdate: boolean = false;

  public set silentUpdate(value: boolean) {
    this._silentUpdate = value;
  }

  public setMapContainer(container: ElementRef | null): void {
    this.mapContainerSubject.next(container);
  }

  public getMapContainer(): ElementRef | null {
    return this.mapContainerSubject.value;
  }

  public setMap(map: WebGLMap): void {
    this.initMap(map);
    this.setListeners(map);
    this.subjectMap.next(map);
  }

  public setMapComponent(mapComponent: LuciadMapComponent) {
    this.subjectMapComponent.next(mapComponent);
  }

  public setContextMenu(menu: ContextMenu | ContextMenuGenerator | null): void {
    this.subjectContextMenu.next(menu);
  }

  public getContextMenu(): ContextMenu | ContextMenuGenerator | null {
    return this.subjectContextMenu.value;
  }

  public onMapChange(): Observable<WebGLMap | null> {
    return this.subjectMap.asObservable();
  }

  public onMapClick(): Observable<Point> {
    return this.subjectPointClick.asObservable();
  }

  public getMap(): WebGLMap | null {
    return this.subjectMap.value;
  }

  public getMapComponent(): LuciadMapComponent | null {
    return this.subjectMapComponent.value;
  }

  public saveState(): SaveState {
    const map = this.getMap();
    if (map) {
      return map.saveState() as SaveState;
    }
    // @ts-ignore
    return null;
  }

  public makeSilentTrigger(): this {
    this._silentUpdate = true;
    setTimeout(() => {
      this._silentUpdate = false;
    }, 0);
    return this;
  }

  public restoreState(mapState: unknown) {
    const map = this.getMap();
    if (map) {
      map.restoreState(mapState);
    }
  }

  public saveCamera(epsg?: string): MaiMapCameraSettings {
    const reference = epsg ? epsg : CRSEnum.EPSG_4326;
    const mapState = this.saveState();
    // @ts-ignore
    if (mapState === null) return null;
    // @ts-ignore
    if (mapState.transformation3D === null) return null;
    const eye = mapState.transformation3D;
    const eyePoint = createPoint(getReference(mapState.reference), [eye.eyePointX, eye.eyePointY, eye.eyePointZ]);
    const pointLonLat = reference !== mapState.reference ? GeoTools.reprojectPoint3D(eyePoint, reference) : eyePoint;
    return {
      // @ts-ignore
      epsg: pointLonLat.reference.identifier,
      point: {
        x: pointLonLat.x,
        y: pointLonLat.y,
        z: pointLonLat.z,
      },
      rotation: {
        roll: eye.roll,
        yaw: eye.yaw,
        pitch: eye.pitch,
      },
    };
  }

  public saveCamera2D(): MaiMapCamera2DSettings {
    const mapState = this.saveState();
    // @ts-ignore
    if (mapState === null) return null;
    // @ts-ignore
    if (mapState.transformation2D === null) return null;
    return {
      epsg: mapState.reference,
      transformation2D: mapState.transformation2D,
      viewSize: mapState.viewSize,
    };
  }

  public restoreCamera(cameraSettings: MaiMapCameraSettings) {
    const map = this.getMap();
    if (map) {
      const mapState = MapFactory.getMapState();
      if (mapState) {
        map.restoreState(mapState, { animate: false });
        MapFactory.removeMapState();
        MapFactory.removeCameraObserverModeTriggerState();
        MapFactory.removeCameraOrbitModeTriggerState();
      } else if (map.reference.equals(getReference(CRSEnum.EPSG_4978))) {
        const reference = cameraSettings.epsg ? cameraSettings.epsg : CRSEnum.EPSG_4326;
        const lookFrom = map.camera.asLookFrom();
        lookFrom.eye = createPoint(getReference(reference), [
          cameraSettings.point.x,
          cameraSettings.point.y,
          cameraSettings.point.z,
        ]);
        lookFrom.pitch = cameraSettings.rotation.pitch;
        lookFrom.roll = cameraSettings.rotation.roll;
        lookFrom.yaw = cameraSettings.rotation.yaw;
        map.camera = map.camera.lookFrom(lookFrom);
      }
    }
  }

  public restoreCamera2D(cameraSettings2D: MaiMapCamera2DSettings) {
    const map = this.getMap();
    if (map) {
      const mapState = MapFactory.getMapState();
      if (mapState) {
        map.restoreState(mapState);
        MapFactory.removeMapState();
        MapFactory.removeCameraObserverModeTriggerState();
        MapFactory.removeCameraOrbitModeTriggerState();
      } else if (!map.reference.equals(getReference(CRSEnum.EPSG_4978))) {
        map.restoreState(cameraSettings2D);
      }
    }
  }

  public isMap3d() {
    const map = this.getMap();
    // @ts-ignore
    return map.reference.equals(getReference(CRSEnum.EPSG_4978));
  }

  private initMap(aMap: WebGLMap) {
    const map = aMap as WebGLMapExtended;
    map.onMouseClick = (point: Point) => {
      this.subjectPointClick.next(point);
    };
    // @ts-ignore
    map.contextMenuFromMap = null;
    map.onCreateCustomContextMenu = (event: ContextMenuOnClosestSurfaceControllerEvent) => {
      // @ts-ignore
      map.contextMenuFromMap = this.getContextMenu();
      setTimeout(() => {
        if (map.contextMenuFromMap) {
          const menu = map.contextMenuFromMap;
          if (menu) {
            if (typeof menu === 'function') {
              map.onShowContextMenu(event.position, menu(event));
            } else {
              map.onShowContextMenu(event.position, menu);
            }
          }
        }
      }, 30);
    };
  }

  private setListeners(map: WebGLMap) {
    map.on('SelectionChanged', (changes) => {
      /**
       Luciad RIA recalculates the internal state of the layer (rendering, recalculation of visible/selected objects) when setting filters for the layer,
       which results in a repeated call to the SelectionChanged event.
       Also, Luciad RIA will not emit SelectionChanged event if an element(s) is selected
       that is/are invisible on the layer.
       Therefore, we have provided the ability to transfer this event to manual mode.
       */
      if (!this._silentUpdate) {
        this.subjectSelectionChange.next(changes.selectionChanges);
      }
    });
  }

  public onSelectionChanges(): Observable<SelectionChangeInfo[]> {
    return this.subjectSelectionChange.asObservable();
  }

  public fitToJSON(geometry: { [key: string]: unknown }) {
    const map = this.getMap();
    if (!map) return;
    if (!geometry) return;
    const geom = JSON.stringify(geometry);
    const shape = decoder.decodeGeometry(geom, CRS84);
    // @ts-ignore
    this.fitToShape(shape);
  }

  public fitToShape(shape: Shape) {
    const map = this.getMap();
    if (shape.type === ShapeType.POINT) {
      const buffer = GeoTools.createBuffer(shape as Point, 80, 80);
      // @ts-ignore
      fitMapToBounds(map, { bounds: buffer.bounds, animate: true, simple: true });
      return;
    }
    if (shape.type === ShapeType.POLYGON) {
      const polygon = shape as Polygon;
      if (polygon.pointCount === 3) {
        const p1 = polygon.getPoint(0);
        const p2 = polygon.getPoint(1);
        const p3 = polygon.getPoint(2);
        if (p1.equals(p2) && p2.equals(p3)) {
          const buffer = GeoTools.createBuffer(shape.focusPoint as Point, 80, 80);
          // @ts-ignore
          fitMapToBounds(map, { bounds: buffer.bounds, animate: true, simple: true });
          return;
        }
      }
    }
    // @ts-ignore
    fitMapToBounds(map, { bounds: shape.bounds, animate: true, simple: true });
  }

  public clearSelection(silent?: boolean): void {
    const map = this.getMap();
    if (silent) {
      this.makeSilentTrigger();
    }
    if (map) map.clearSelection();
  }
}
