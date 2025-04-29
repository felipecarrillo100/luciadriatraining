import {
  FeaturePainter,
  FeaturePainterEvents,
  PaintState,
} from '@luciad/ria/view/feature/FeaturePainter';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { Icon3DStyle } from '@luciad/ria/view/style/Icon3DStyle';
import {
  getPanoDropStyle,
  createPanoOrbMesh,
  getPanoOrbStyle,
} from './PanoramaStyle';
import { Point } from '@luciad/ria/shape/Point';
import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { Handle } from '@luciad/ria/util/Evented';
import { Layer } from '@luciad/ria/view/Layer';
import { Map as RIAMap } from '@luciad/ria/view/Map';
import {
  PanoramaModel,
  PanoramicImageTileRequest,
} from '@luciad/ria/model/tileset/PanoramaModel';
import { PanoFeature } from './PanoCodec';
import { CubeMapFace } from '@luciad/ria/model/tileset/CubeMapFace';
import { Mesh } from '@luciad/ria/geometry/mesh/Mesh';

export const ACTIVE_PANORAMA_CHANGED_EVENT = 'ActivePanoramaChanged';
type FeatureId = string | number;

interface PanoImage {
  image?: HTMLImageElement;
  mesh?: Mesh;
}

export class PanoramaFeaturePainterPlus extends FeaturePainter {
  private readonly panoramaModel: PanoramaModel;
  private readonly regularStyle3D: Icon3DStyle;
  private readonly hoverStyle3D: Icon3DStyle;
  private readonly panoMap: Map<FeatureId, PanoImage> = new Map();
  private _opacityMap: Map<string | number, number> = new Map();
  private activeFeatureId: FeatureId | null = null;

  private highlightedFeatureId: FeatureId | null = null;
  private _evented: EventedSupport;

  constructor(panoramaModel: PanoramaModel) {
    super();
    const baseStyle3D = getPanoDropStyle();
    this.panoramaModel = panoramaModel;

    this.regularStyle3D = { ...baseStyle3D, color: 'rgb(255,255,255,0.5)' };
    this.hoverStyle3D = { ...baseStyle3D, color: 'rgb(255,255,255,0.95)' };

    this._evented = new EventedSupport([ACTIVE_PANORAMA_CHANGED_EVENT], true);
  }

  override paintBody(
    geoCanvas: GeoCanvas,
    feature: PanoFeature,
    shape: Point,
    _layer: Layer,
    map: RIAMap,
    { hovered }: PaintState
  ): void {
    geoCanvas.drawIcon3D(
      shape,
      hovered ? this.hoverStyle3D : this.regularStyle3D
    );

    if (feature.id === this.highlightedFeatureId) {
      this.paintPanoPoint(geoCanvas, feature, map);
    }

    if (this.isPanoVisible(feature)) {
      this.paintPanorama(geoCanvas, feature);
    }
  }

  private getPointOrbMesh(feature: PanoFeature): Mesh | null {
    const style = this.panoMap.get(feature.id);
    if (style) {
      return style.mesh ?? null;
    }
    // lazy image resolution
    this.resolveFaceImage(feature).then(() => undefined);
    return null;
  }

  private paintPanoPoint(
    geoCanvas: GeoCanvas,
    feature: PanoFeature,
    map: RIAMap
  ) {
    const mesh = this.getPointOrbMesh(feature);
    const style = getPanoOrbStyle(mesh, map, feature.shape);

    geoCanvas.drawIcon3D(feature.shape, style);
  }

  private paintPanorama(geoCanvas: GeoCanvas, feature: PanoFeature): void {
    const opacity = this.getPanoOpacity(feature);
    geoCanvas.drawPanorama(feature.shape, {
      opacity,
      skyOpacity: opacity,
      orientation: feature.properties.orientation,
    });
  }

  isPanoVisible(feature: Feature): boolean {
    return this._opacityMap.has(feature.id);
  }

  setPanoOpacity(feature: Feature, opacity: number): void {
    if (opacity > 0) {
      this._opacityMap.set(feature.id, opacity);
    } else {
      this._opacityMap.delete(feature.id);
    }
    super.invalidateById(feature.id);
  }

  getPanoOpacity(feature: Feature): number {
    return this._opacityMap.get(feature.id) ?? 0;
  }

  setActive(feature: Feature | null): void {
    const oldActiveFeatureId = this.activeFeatureId;
    this.activeFeatureId = feature?.id ?? null;

    if (this.activeFeatureId === this.highlightedFeatureId) {
      // unhighlight the active pano point
      this.clearHighlight();
    }
    if (oldActiveFeatureId !== null) {
      this.invalidateById(oldActiveFeatureId);
    }
    if (this.activeFeatureId !== null) {
      this.clearHighlight();
      this.invalidateById(this.activeFeatureId);
    }
    this._evented.emit(ACTIVE_PANORAMA_CHANGED_EVENT, feature);
  }

  highlight(feature: Feature) {
    const id = feature.id;
    const previous = this.highlightedFeatureId;
    this.highlightedFeatureId = id;
    if (previous !== null) this.invalidateById(previous);
    this.invalidateById(id);
  }

  clearHighlight() {
    const previous = this.highlightedFeatureId;
    this.highlightedFeatureId = null;
    if (previous !== null) this.invalidateById(previous);
  }

  hasHighlightedPoint(): boolean {
    return this.highlightedFeatureId !== null;
  }

  private async resolveFaceImage(feature: PanoFeature) {
    // that means the orb mesh is requested and will be resolved lazily
    this.panoMap.set(feature.id, {});
    const face = CubeMapFace.FRONT;
    const request: PanoramicImageTileRequest = {
      feature,
      face,
      level: 0,
      x: 0,
      y: 0,
      context: {},
    };
    const requestPromise = new Promise((resolve, reject) => {
      this.panoramaModel.getPanoramicImage(
        request,
        (_, image) => resolve(image as HTMLImageElement),
        () => reject()
      );
    }) as Promise<HTMLImageElement>;

    const image = await requestPromise;
    const mesh = createPanoOrbMesh(image);
    this.panoMap.set(feature.id, { image, mesh });
    this.invalidateById(feature.id);
  }

  override on(
    event: typeof ACTIVE_PANORAMA_CHANGED_EVENT | FeaturePainterEvents,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (...args: any[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: any
  ): Handle {
    if (event === ACTIVE_PANORAMA_CHANGED_EVENT) {
      return this._evented.on(event, callback);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.on(event as any, callback, context);
  }
}
