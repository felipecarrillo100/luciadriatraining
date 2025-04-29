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
import {Controller} from "@luciad/ria/view/controller/Controller";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {GeoCanvas} from "@luciad/ria/view/style/GeoCanvas";
import {Shape} from "@luciad/ria/shape/Shape";
import {PaintState} from "@luciad/ria/view/feature/FeaturePainter";
import {Point} from "@luciad/ria/shape/Point";
import {ShapeStyle} from "@luciad/ria/view/style/ShapeStyle";
import {Map} from "@luciad/ria/view/Map";
import {Handle} from "@luciad/ria/util/Evented";
import {createPentagon3D} from "./shapes/HexagonShape";

export class PaintPanoFeatureController extends Controller {

  private readonly _layers: FeatureLayer[];
  private _hoveredFeature: Feature | null;
  private _hoveredLayer: FeatureLayer | null;
  private visible: boolean = false;
  private layerVisibilityHandles: Handle[] = [];
  private eventNodeRemoved: Handle | null =  null;
  private activeFeature: Feature | null = null;
  private activeLayer: FeatureLayer | null = null;

  constructor(layers?: FeatureLayer[]) {
    super();
    this._layers = layers || [];
    this._hoveredFeature = null;
    this._hoveredLayer = null;
  }

  override onActivate(map: Map) {
    super.onActivate(map);
    this.setListeners();
  }

  override onDeactivate(map: Map) {
    this.releaseListeners();
    return super.onDeactivate(map);
  }

  public handleHoverRepaint(hover: boolean, layer: FeatureLayer, feature: Feature | null) {
    this._hoveredFeature = feature;
    this._hoveredLayer = layer;
    this.invalidate();
  }


  override onDraw(geoCanvas: GeoCanvas) {
    if (!this.visible) return;
    for (const layer of this._layers) {
      if (layer.visible) {

        const features = layer.workingSet.get();
        for (const feature of features) {
          if (!(this.activeLayer === layer && feature === this.activeFeature)) {
            const paintState: PaintState = {
              selected: false,
              hovered: (this._hoveredLayer === layer && this._hoveredFeature === feature),
              level: 0
            }
            const anotherShape = feature.shape?.copy() as Shape;
            this.paintBody(geoCanvas, anotherShape as Shape, paintState, layer.painter);
          }
        }
      }
    }
  }

  show(visible: boolean) {
    this.visible =  visible;
    this.invalidate();
  }

  private paintBody(geoCanvas: GeoCanvas, shape: Shape, paintState: PaintState, painter: any): void {
    const sensorLocation = (shape as Point).copy();
    sensorLocation.translate3D(0, 0, - painter._sensorHeight);
    const newShape = createPentagon3D(sensorLocation, sensorLocation.z,sensorLocation.z + 0.10);

    if (paintState.hovered) {
      geoCanvas.drawShape(newShape, painter._hoverShapeStyle);
    } else {
      geoCanvas.drawShape(newShape, painter._regularShapeStyle);
    }
  }

  private setListeners() {
      this.layerVisibilityHandles = [];
      for (const layer of this._layers) {
        const visibilityHandle = layer.on("VisibilityChanged", ()=>{
          this.invalidate();
        })
        this.layerVisibilityHandles.push(visibilityHandle);
      }
      if (this.map) {
        this.eventNodeRemoved = this.map.layerTree.on("NodeRemoved", ()=>{
          this.invalidate()
        });
      }
  }

  private releaseListeners() {
    for (const handle of this.layerVisibilityHandles) {
      handle.remove();
    }
    this.layerVisibilityHandles = [];
    if (this.eventNodeRemoved) this.eventNodeRemoved.remove();
    this.eventNodeRemoved = null;
  }

  setActive(feature: Feature | null, layer: FeatureLayer | null) {
    this.activeFeature = feature;
    this.activeLayer = layer;
    this.invalidate();
  }
}
