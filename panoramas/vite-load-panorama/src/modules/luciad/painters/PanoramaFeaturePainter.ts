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
import {Feature} from "@luciad/ria/model/feature/Feature.js";
import {Point} from "@luciad/ria/shape/Point.js";
import {Shape} from "@luciad/ria/shape/Shape.js";
import {EventedSupport} from "@luciad/ria/util/EventedSupport.js";
import {FeaturePainter, FeaturePainterEvents, PaintState} from "@luciad/ria/view/feature/FeaturePainter.js";
import {Layer} from "@luciad/ria/view/Layer.js";
import {Map as RIAMap} from "@luciad/ria/view/Map.js";
import {IconStyle} from "@luciad/ria/view/style/IconStyle.js";
import {getUnitOfMeasure} from "@luciad/ria/uom/UnitOfMeasureRegistry.js";
import {GeoCanvas} from "@luciad/ria/view/style/GeoCanvas";
import {Handle} from "@luciad/ria/util/Evented";
import {PanoIcon} from "./PanoIcon.ts";
import {createHexagon} from "../utils/IconFactory.ts";
import {DrapeTarget} from "@luciad/ria/view/style/DrapeTarget";

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
}

export const ACTIVE_PANORAMA_CHANGED_EVENT = "ActivePanoramaChanged";
export const HOVER_PANORAMA_CHANGED_EVENT = "HoverPanoramaChanged";

const METER_UOM = getUnitOfMeasure('Meter');
const IconSizeInMeters = "1.2";
const ICON_PIXEL_SIZE = 512;
export class PanoramaFeaturePainter extends FeaturePainter {

    private readonly _isOverview: boolean;
    private readonly _sensorHeight: number;

    private readonly _regularStyle3DMod: IconStyle;
    private readonly _hoverStyle3DMod: IconStyle;
    private readonly _activeStyle3DMod: IconStyle;

    private readonly _regularStyleOverview: IconStyle;
    private readonly _hoverStyleOverview: IconStyle;
    private readonly _activeStyleOverview: IconStyle;

    private _opacityMap: Map<string | number, number>;
    private _hoverFeatureId: string | number | null;
    private _activeFeatureId: string | number | null;

    private _evented: EventedSupport;

    constructor(options?: PanoramaFeaturePainterConstructorOptions) {
        super();
        const regularColor = "#2BC4CE";
        const hoverColor = "#B2FF52";
        const activeColor = "rgb(255,255,76)";

        this._regularStyle3DMod = {
            drapeTarget: DrapeTarget.NOT_DRAPED,
            width: IconSizeInMeters,
            height: IconSizeInMeters,
            uom: METER_UOM,
            image: PanoIcon({width: ICON_PIXEL_SIZE, height: ICON_PIXEL_SIZE, fill: regularColor, stroke: "#FFFFFF", strokeWidth: 1}),
        };
        this._hoverStyle3DMod = {
            drapeTarget: DrapeTarget.NOT_DRAPED,
            width: IconSizeInMeters,
            height: IconSizeInMeters,
            uom: METER_UOM,
            image: PanoIcon({width: ICON_PIXEL_SIZE, height: ICON_PIXEL_SIZE, fill: hoverColor, stroke: "#FFFFFF", strokeWidth: 1}),
        };
        this._activeStyle3DMod = {
            drapeTarget: DrapeTarget.NOT_DRAPED,
            width: IconSizeInMeters,
            height: IconSizeInMeters,
            uom: METER_UOM,
            image: PanoIcon({width: ICON_PIXEL_SIZE, height: ICON_PIXEL_SIZE, fill: activeColor, stroke: "#FFFFFF", strokeWidth: 1}),
        };

        this._regularStyleOverview = {image: PanoIcon({width: ICON_PIXEL_SIZE, height: ICON_PIXEL_SIZE, fill: regularColor, stroke: "#FFFFFF", strokeWidth: 1}), zOrder: 1};
        this._hoverStyleOverview = {image: PanoIcon({width: ICON_PIXEL_SIZE, height: ICON_PIXEL_SIZE, fill: hoverColor, stroke: "#FFFFFF", strokeWidth: 1}), zOrder: 2};
        this._activeStyleOverview = {image: PanoIcon({width: ICON_PIXEL_SIZE, height: ICON_PIXEL_SIZE, fill: hoverColor, stroke: "#FFFFFF", strokeWidth: 1}), zOrder: 3};

        this._sensorHeight = (options && typeof options.iconHeightOffset === "number") ? options.iconHeightOffset : 0;
        this._isOverview = (options && typeof options.overview === "boolean") ? options.overview : false;

        this._opacityMap = new Map();
        this._hoverFeatureId = null;
        this._activeFeatureId = null;

        this._evented = new EventedSupport([ACTIVE_PANORAMA_CHANGED_EVENT, HOVER_PANORAMA_CHANGED_EVENT], true);
    }

    paintBody(geoCanvas: GeoCanvas, feature: Feature, shape: Shape, layer: Layer, map: RIAMap, paintState: PaintState): void {
        const sensorLocation = (shape as Point).copy();
        sensorLocation.translate3D(0, 0, -this._sensorHeight);

        if (this._isOverview) {
            if (this._activeFeatureId === feature.id) {
                geoCanvas.drawIcon(sensorLocation, this._activeStyleOverview);
            } else if (paintState.hovered) {
                geoCanvas.drawIcon(sensorLocation, this._hoverStyleOverview);
            } else {
                geoCanvas.drawIcon(sensorLocation, this._regularStyleOverview);
            }
        } else {
            if (this._activeFeatureId === feature.id) {
                // geoCanvas.drawIcon3D(sensorLocation, this._activeStyle3D);
                geoCanvas.drawIcon(sensorLocation, this._activeStyle3DMod);
            } else if (paintState.hovered) {
                // geoCanvas.drawIcon3D(sensorLocation, this._hoverStyle3D);
                geoCanvas.drawIcon(sensorLocation, this._hoverStyle3DMod);
            } else {
                // geoCanvas.drawIcon3D(sensorLocation, this._regularStyle3D);
                geoCanvas.drawIcon(sensorLocation, this._regularStyle3DMod);
            }
            this.paintPanorama(geoCanvas, feature, shape);
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
        return typeof feature.properties.orientation !== "undefined" ? feature.properties.orientation : 0;
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

    setActive(feature: Feature | null): void {
        const oldActiveFeatureId = this._activeFeatureId;
        this._activeFeatureId = feature ? feature.id : null;
        if (oldActiveFeatureId !== null) {
            super.invalidateById(oldActiveFeatureId);
        }
        if (this._activeFeatureId !== null) {
            super.invalidateById(this._activeFeatureId);
        }
        this._evented.emit(ACTIVE_PANORAMA_CHANGED_EVENT, feature);
    }

    on(event: typeof ACTIVE_PANORAMA_CHANGED_EVENT | typeof HOVER_PANORAMA_CHANGED_EVENT | FeaturePainterEvents,
       callback: (...args: any[]) => void, context?: any): Handle {
        if (event === ACTIVE_PANORAMA_CHANGED_EVENT || event === HOVER_PANORAMA_CHANGED_EVENT) {
            return this._evented.on(event, callback);
        }
        return super.on(event as any, callback, context);
    }
}
