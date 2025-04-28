import { BasicFeaturePainter } from '@luciad/ria/view/feature/BasicFeaturePainter.js';
import { BorderPaintState, FeaturePainter, PaintState } from '@luciad/ria/view/feature/FeaturePainter';
import { ShapeType } from '@luciad/ria/shape/ShapeType.js';
import { DrapeTarget } from '@luciad/ria/view/style/DrapeTarget.js';
import { IconFactory } from '../controllers/ruler3d/IconFactory';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { Map } from '@luciad/ria/view/Map.js';
import { BorderLabelCanvas } from '@luciad/ria/view/style/BorderLabelCanvas';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { Shape } from '@luciad/ria/shape/Shape';
import { Layer } from '@luciad/ria/view/Layer';
import { BorderGeoCanvas } from '@luciad/ria/view/style/BorderGeoCanvas';
import { PointLabelPosition } from '@luciad/ria/view/style/PointLabelPosition.js';
import { LabelCanvas } from '@luciad/ria/view/style/LabelCanvas';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { isCluster } from '@luciad/ria/view/feature/transformation/ClusteringTransformer.js';

const size = 64;
const DEFAULT_CLUSTER_ICON_STYLE = {
  drapeTarget: DrapeTarget.NOT_DRAPED,
  width: `${size}px`,
  height: `${size}px`,
  image: IconFactory.circle({
    width: size,
    height: size,
    fill: 'rgba(35,37,147,1)',
    //  stroke: "rgba(0, 78, 146, 1)",
    stroke: 'rgb(41,146,0)',
    strokeWidth: size / 8,
  }),
  zOrder: 3,
};

const DEFAULT_CLUSTER_ICON_SELECTED_STYLE = {
  drapeTarget: DrapeTarget.NOT_DRAPED,
  width: `${size}px`,
  height: `${size}px`,
  image: IconFactory.circle({
    width: size,
    height: size,
    fill: 'rgba(101,20,20,1)',
    //   stroke: "rgba(0, 78, 146, 1)",
    stroke: 'rgb(146,56,0)',
    strokeWidth: size / 8,
  }),
  zOrder: 3,
};

export class ClusteringPainter extends BasicFeaturePainter {
  protected readonly _delegatePainter: FeaturePainter;

  constructor(delegatePainter: FeaturePainter) {
    super();
    this.setStyle(ShapeType.POINT, { hovered: false, selected: false }, DEFAULT_CLUSTER_ICON_STYLE);
    this.setStyle(ShapeType.POINT, { hovered: false, selected: true }, DEFAULT_CLUSTER_ICON_SELECTED_STYLE);
    this._delegatePainter = delegatePainter;
  }

  override getDetailLevelScales(layer?: FeatureLayer, map?: Map): number[] | null {
    return this._delegatePainter.getDetailLevelScales(layer, map);
  }
  override paintBody(
    geoCanvas: GeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ): void {
    if (isCluster(feature)) {
      this.paintClusterBody(geoCanvas, feature, shape, layer, map, paintState);
    } else if (typeof this._delegatePainter.paintBody === 'function') {
      this._delegatePainter.paintBody(geoCanvas, feature, shape, layer, map, paintState);
    }
  }

  paintClusterBody(
    geoCanvas: GeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ): void {
    super.paintBody(geoCanvas, feature, shape, layer, map, paintState);
  }

  override paintLabel?(
    labelCanvas: LabelCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ): void {
    if (isCluster(feature)) {
      // Uncomment later
      this.paintClusterLabel(labelCanvas, feature, shape, layer, map, paintState);
    } else if (typeof this._delegatePainter.paintLabel === 'function') {
      this._delegatePainter.paintLabel(labelCanvas, feature, shape, layer, map, paintState);
    }
  }

  protected paintClusterLabel(
    labelCanvas: LabelCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ): void {
    const label = !paintState.selected
      ? `<span style='color: rgb(76,118,154);'>${feature.properties['clusteredElements'].length}</span>`
      : `<span style='color: rgb(98,24,57);'>${feature.properties['clusteredElements'].length}</span>`;
    labelCanvas.drawLabel(label, shape.focusPoint, { positions: PointLabelPosition.CENTER });
  }

  override paintBorderBody(
    borderGeoCanvas: BorderGeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: BorderPaintState,
  ): void {
    if (isCluster(feature)) {
      this.paintClusterBorderBody(borderGeoCanvas, feature, shape, layer, map, paintState);
    } else if (typeof this._delegatePainter.paintBorderBody === 'function') {
      this._delegatePainter.paintBorderBody(borderGeoCanvas, feature, shape, layer, map, paintState);
    }
  }

  paintClusterBorderBody(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    borderGeoCanvas: BorderGeoCanvas,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    feature: Feature,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    shape: Shape,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    layer: Layer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    map: Map,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    paintState: PaintState,
  ): void {
    //nothing by default
  }

  override paintBorderLabel(
    borderLabelCanvas: BorderLabelCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: BorderPaintState,
  ): void {
    if (isCluster(feature)) {
      this.paintClusterBorderLabel(borderLabelCanvas, feature, shape, layer, map, paintState);
    } else if (typeof this._delegatePainter.paintBorderLabel === 'function') {
      this._delegatePainter.paintBorderLabel(borderLabelCanvas, feature, shape, layer, map, paintState);
    }
  }

  paintClusterBorderLabel(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    borderLabelCanvas: BorderLabelCanvas,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    feature: Feature,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    shape: Shape,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    layer: Layer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    map: Map,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    paintState: PaintState,
  ): void {
    //nothing by default
  }
}
