/*
 *
 * Copyright (c) 1999-2022 Luciad All Rights Reserved.
 *
 * Luciad grants you ("Licensee") a non-exclusive, royalty free, license to use,
 * modify and redistribute this software in source and binary code form,
 * provided that i) this copyright notice and license appear on all copies of
 * the software; and ii) Licensee does not utilize the software in a manner
 * which is disparaging to Luciad.
 *
 * This software is provided "AS IS," without a warranty of any kind. ALL
 * EXPRESS OR IMPLIED CONDITIONS, REPRESENTATIONS AND WARRANTIES, INCLUDING ANY
 * IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR
 * NON-INFRINGEMENT, ARE HEREBY EXCLUDED. LUCIAD AND ITS LICENSORS SHALL NOT BE
 * LIABLE FOR ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING
 * OR DISTRIBUTING THE SOFTWARE OR ITS DERIVATIVES. IN NO EVENT WILL LUCIAD OR ITS
 * LICENSORS BE LIABLE FOR ANY LOST REVENUE, PROFIT OR DATA, OR FOR DIRECT,
 * INDIRECT, SPECIAL, CONSEQUENTIAL, INCIDENTAL OR PUNITIVE DAMAGES, HOWEVER
 * CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, ARISING OUT OF THE USE OF
 * OR INABILITY TO USE SOFTWARE, EVEN IF LUCIAD HAS BEEN ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGES.
 */
import {Feature} from "@luciad/ria/model/feature/Feature";
import {Point} from "@luciad/ria/shape/Point";
import {Shape} from "@luciad/ria/shape/Shape";
import {Handle} from "@luciad/ria/util/Evented";
import {EventedSupport} from "@luciad/ria/util/EventedSupport";
import {FeaturePainter, FeaturePainterEvents, PaintState} from "@luciad/ria/view/feature/FeaturePainter";
import {Layer} from "@luciad/ria/view/Layer";
import {Map as RIAMap} from "@luciad/ria/view/Map";
import {GeoCanvas} from "@luciad/ria/view/style/GeoCanvas";
import {Icon3DStyle} from "@luciad/ria/view/style/Icon3DStyle";
import {IconStyle} from "@luciad/ria/view/style/IconStyle";
import {createPanorama2DIcon, createPanorama3DIcon, createPanorama3DIconV2} from "./PanoramaIcon";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";

export interface PanoramaFeaturePainterConstructorOptions {
  /**
   * The height to offset icons with. This can be used to push icons down to ground level.
   * For example, if the panorama's were made with a sensor mounted on top of a car at +- 2.5m above the ground,
   * you can use this to push the icons back to ground level.
   *
   * This height is expressed in meters.
   */
  iconHeightOffset?: number;

  /**
   * Indicates that this painter is used on a 2D overview map, instead of a 3D map
   */
  overview?: boolean;

  controllerPainter?: boolean;
}

export const ACTIVE_PANORAMA_CHANGED_EVENT = "ActivePanoramaChanged";
export const HOVER_PANORAMA_CHANGED_EVENT = "HoverPanoramaChanged";

export class PanoramaFeaturePainter extends FeaturePainter {

  private readonly _isOverview: boolean;
  private readonly _sensorHeight: number;

  private readonly _regularStyle3D: Icon3DStyle;
  private readonly _hoverStyle3D: Icon3DStyle;
  private readonly _activeStyle3D: Icon3DStyle;

  private readonly _regularStyleOverview: IconStyle;
  private readonly _hoverStyleOverview: IconStyle;
  private readonly _activeStyleOverview: IconStyle;

  private _opacityMap: Map<string | number, number>;
  private _hoverFeatureId: string | number | null;
  private _activeFeatureId: string | number | null;

  private _evented: EventedSupport;
  private _controllerPainter: boolean | undefined;
  private _activeFeatureLayer: FeatureLayer | undefined | null;


  constructor(options?: PanoramaFeaturePainterConstructorOptions) {
    super();
    const regularColor = "rgba(43,196,206,1)";
    const hoverColor = "rgba(178,255,82,1)";
    const activeColor = "rgba(255,255,76, 1)";

    const baseStyle3D = {
      mesh: createPanorama3DIcon()
    };

    this._regularStyle3D = {...baseStyle3D, color: regularColor};
    this._hoverStyle3D = {...baseStyle3D, color: hoverColor};
    this._activeStyle3D = {...baseStyle3D, color: activeColor};

    this._regularStyleOverview = {image: createPanorama2DIcon(regularColor), zOrder: 1};
    this._hoverStyleOverview = {image: createPanorama2DIcon(hoverColor), zOrder: 2};
    this._activeStyleOverview = {image: createPanorama2DIcon(activeColor), zOrder: 3};

    this._sensorHeight = (options && typeof options.iconHeightOffset === "number") ? options.iconHeightOffset : 0;
    this._isOverview = (options && typeof options.overview === "boolean") ? options.overview : false;
    this._controllerPainter = !!options?.controllerPainter;

    this._opacityMap = new Map();
    this._hoverFeatureId = null;
    this._activeFeatureId = null;

    this._evented = new EventedSupport([ACTIVE_PANORAMA_CHANGED_EVENT, HOVER_PANORAMA_CHANGED_EVENT], true);
  }

  override paintBody(geoCanvas: GeoCanvas, feature: Feature, shape: Shape, layer: Layer, map: RIAMap,
            paintState: PaintState): void {
    const sensorLocation = (shape as Point).copy();
    sensorLocation.translate3D(0, 0, - this._sensorHeight);

    if (this._isOverview) {
      if (this._activeFeatureLayer === layer && this._activeFeatureId === feature.id) {
        geoCanvas.drawIcon(sensorLocation, this._activeStyleOverview);
      } else if (this._hoverFeatureId === feature.id) {
        geoCanvas.drawIcon(sensorLocation, this._hoverStyleOverview);
      } else {
        geoCanvas.drawIcon(sensorLocation, this._regularStyleOverview);
      }
    } else {
      if (this._activeFeatureLayer === layer && this._activeFeatureId === feature.id) {
        geoCanvas.drawIcon3D(sensorLocation, this._activeStyle3D);
      } else if (this._hoverFeatureId === feature.id) {
        geoCanvas.drawIcon3D(sensorLocation, this._hoverStyle3D);
      } else {
        geoCanvas.drawIcon3D(sensorLocation, this._regularStyle3D);
      }
      if (!this._controllerPainter) this.paintPanorama(geoCanvas, feature, shape);
    }
  }

  paintPanorama(geoCanvas: GeoCanvas, feature: Feature, shape: Shape): void {
    if (this.isPanoVisible(feature) && shape.focusPoint) {
      const opacity = this.getPanoOpacity(feature);
      geoCanvas.drawPanorama(shape.focusPoint!, {
        opacity,
        skyOpacity: opacity,
        orientation: this.getPanoOrientation(feature)
      });
    }
  }

  getPanoOrientation(feature: Feature): number {
    return feature.properties["orientation"];
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

  getPanoOpacity(feature: Feature): number | undefined {
    return this._opacityMap.get(feature.id);
  }

  setHover(feature: Feature | null): void {
    const oldHoverFeatureId = this._hoverFeatureId;
    this._hoverFeatureId = feature ? feature.id : null;
    if (oldHoverFeatureId !== null) {
      super.invalidateById(oldHoverFeatureId);
    }
    if (this._hoverFeatureId !== null) {
      super.invalidateById(this._hoverFeatureId);
    }
    this._evented.emit(HOVER_PANORAMA_CHANGED_EVENT, feature);
  }

  setActive(feature: Feature | null, layer?: FeatureLayer | null): void {
    const oldActiveFeatureId = this._activeFeatureId;
    const oldActiveLayer = this._activeFeatureLayer;

    this._activeFeatureId = feature ? feature.id : null;
    this._activeFeatureLayer = layer;

    if (oldActiveFeatureId !== null && oldActiveLayer) {
      oldActiveLayer.painter.invalidateById(oldActiveFeatureId);
    }
    if (this._activeFeatureId !== null && this._activeFeatureLayer ) {
      this._activeFeatureLayer?.painter.invalidateById(this._activeFeatureId);
    }
    this._evented.emit(ACTIVE_PANORAMA_CHANGED_EVENT, feature);
  }

  override on(event: typeof ACTIVE_PANORAMA_CHANGED_EVENT | typeof HOVER_PANORAMA_CHANGED_EVENT | FeaturePainterEvents,
     callback: (...args: any[]) => void, context?: any): Handle {
    if (event === ACTIVE_PANORAMA_CHANGED_EVENT || event === HOVER_PANORAMA_CHANGED_EVENT) {
      return this._evented.on(event, callback);
    }
    return super.on(event as any, callback, context);
  }
}
