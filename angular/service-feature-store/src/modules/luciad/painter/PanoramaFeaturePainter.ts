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
import { Feature } from '@luciad/ria/model/feature/Feature';
import { Point } from '@luciad/ria/shape/Point';
import { Shape } from '@luciad/ria/shape/Shape';
import { Handle } from '@luciad/ria/util/Evented';
import { EventedSupport } from '@luciad/ria/util/EventedSupport';
import { FeaturePainter, FeaturePainterEvents, PaintState } from '@luciad/ria/view/feature/FeaturePainter';
import { Layer } from '@luciad/ria/view/Layer';
import { Map as RIAMap } from '@luciad/ria/view/Map';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { IconStyle } from '@luciad/ria/view/style/IconStyle';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { Context } from '@apollo/client';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import { ShapeType } from '@luciad/ria/shape/ShapeType';
import { PointLabelPosition } from '@luciad/ria/view/style/PointLabelPosition';
import { PointLabelStyle } from '@luciad/ria/view/style/PointLabelStyle';
import { OcclusionMode } from '@luciad/ria/view/style/OcclusionMode';

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
  occlusionMode?: OcclusionMode;
}

export const ACTIVE_PANORAMA_CHANGED_EVENT = 'ActivePanoramaChanged';

const panoramaHoverSvgs = {
  0: '/assets/icons/document/hover_box/hover_box_file_document.svg',
};

type PanoramaChangedCallback = (...args: unknown[]) => void;
type FeaturePainterCallback = (...args: unknown[]) => void;

type CallbackFunction = PanoramaChangedCallback | FeaturePainterCallback;

export class PanoramaFeaturePainter extends FeaturePainter {
  private readonly _isOverview: boolean;

  private readonly _regularStyleOverview: IconStyle;
  private readonly _hoverStyleOverview: IconStyle;
  private readonly _activeStyleOverview: IconStyle;

  private _opacityMap: Map<string | number, number>;
  private _hoverFeatureId: string | number | null;
  private _activeFeatureId: string | number | null;
  private _evented: EventedSupport;
  private _activeFeatureLayer: FeatureLayer | undefined | null;

  constructor(options?: PanoramaFeaturePainterConstructorOptions) {
    super();

    this._regularStyleOverview = { url: './assets/icons/pano/general/default/pano.png', zOrder: 1 };
    this._hoverStyleOverview = { url: './assets/icons/pano/general/hovered/pano.png', zOrder: 2 };
    this._activeStyleOverview = { url: './assets/icons/pano/general/selected/pano.png', zOrder: 3 };

    this._isOverview = options && typeof options.overview === 'boolean' ? options.overview : false;

    this._opacityMap = new Map();
    this._hoverFeatureId = null;
    this._activeFeatureId = null;

    this._evented = new EventedSupport([ACTIVE_PANORAMA_CHANGED_EVENT], true);
  }

  override paintBody(
    geoCanvas: GeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: RIAMap,
    paintState: PaintState,
  ): void {
    const sensorLocation = (shape as Point).copy();
    let iconStyle: IconStyle;

    // Determine which icon style to use based on state
    if (this._activeFeatureLayer === layer && this._activeFeatureId === feature.id) {
      iconStyle = this._activeStyleOverview;
    } else if ((this._isOverview && this._hoverFeatureId === feature.id) || (!this._isOverview && paintState.hovered)) {
      iconStyle = this._hoverStyleOverview;
    } else {
      iconStyle = this._regularStyleOverview;
    }

    // Apply default configuration to style
    const style = {
      ...iconStyle,
      occlusionMode: document.appMapSettings?.itemsOcclusion
        ? OcclusionMode.VISIBLE_ONLY
        : OcclusionMode.ALWAYS_VISIBLE,
    };

    geoCanvas.drawIcon(sensorLocation, style);

    // Only draw panorama if not in overview mode
    if (!this._isOverview) {
      this.paintPanorama(geoCanvas, feature, shape);
    }
  }

  override paintLabel(
    labelCanvas: LabelCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: RIAMap,
    paintState: PaintState,
  ) {
    if (!paintState.hovered) return;

    if (paintState.hovered && !this.isPanoVisible(feature)) {
      this.paintLocalLabel(labelCanvas, feature, shape);
    }
  }

  public setActive(feature: Feature | null, layer?: FeatureLayer | null): void {
    const oldActiveFeatureId = this._activeFeatureId;
    const oldActiveLayer = this._activeFeatureLayer;

    this._activeFeatureId = feature ? feature.id : null;
    this._activeFeatureLayer = layer;

    if (oldActiveFeatureId !== null && oldActiveLayer) {
      oldActiveLayer.painter.invalidateById(oldActiveFeatureId);
    }
    if (this._activeFeatureId !== null && this._activeFeatureLayer) {
      this._activeFeatureLayer.painter.invalidateById(this._activeFeatureId);
    }
    this._evented.emit(ACTIVE_PANORAMA_CHANGED_EVENT, feature);
  }

  paintPanorama(geoCanvas: GeoCanvas, feature: Feature, shape: Shape): void {
    if (this.isPanoVisible(feature) && shape.focusPoint) {
      const opacity = this.getPanoOpacity(feature);

      geoCanvas.drawPanorama(shape.focusPoint, {
        opacity,
        skyOpacity: opacity,
        orientation: this.getPanoOrientation(feature),
      });
    }
  }

  getPanoOrientation(feature: Feature): number {
    return feature.properties['orientation'];
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

  private paintLocalLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape) {
    const label = feature.properties['name'];
    const panoLocation = (shape as Point).copy();
    const labelHTML = `
      <table class="item-detail-box">
        <tr>
          <td>
            <img src="${panoramaHoverSvgs[0]}" alt="item svg"/>
          </td>
          <td>
            <p class="item-title-label">${label}</p>
          </td>
        </tr>
      </table>
    `;

    if ((shape.type === ShapeType.POINT || shape.type === ShapeType.POLYGON) && shape.focusPoint) {
      labelCanvas.drawLabel(labelHTML, panoLocation, {
        positions: [PointLabelPosition.NORTH],
        offset: 10,
      } as PointLabelStyle);
    }
  }

  override on(
    event: typeof ACTIVE_PANORAMA_CHANGED_EVENT | FeaturePainterEvents,
    callback: CallbackFunction,
    context?: Context,
  ): Handle {
    if (event === ACTIVE_PANORAMA_CHANGED_EVENT) {
      return this._evented.on(event, callback);
    }

    return super.on(event as never, callback, context);
  }
}
