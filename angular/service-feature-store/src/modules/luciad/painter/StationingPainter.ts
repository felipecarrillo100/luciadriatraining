import { PaintState } from '@luciad/ria/view/feature/FeaturePainter';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { Shape } from '@luciad/ria/shape/Shape';
import { Layer } from '@luciad/ria/view/Layer';
import { Map } from '@luciad/ria/view/Map';
import { MeasurementPainter, PAINT_STYLES } from './MeasurementPainter';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { StationingMeasurement } from '../controllers/ruler3d/measurement/StationingMeasurement';
import {MeasurementWrapper} from '../interfaces/MeasurementWrapper';

export class StationingPainter extends MeasurementPainter {
  getDetailLevelScales(): number[] | null {
    return [1.0 / 2500, 1.0 / 10000];
  }

  constructor(/*private translateService: TranslateService*/) {
    super();
  }

  override paintBody(
    geoCanvas: GeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ) {
    if (paintState.level === 0) return;
    const wrapper = feature.properties['measurementWrapper'] as MeasurementWrapper;
    const measurement = wrapper.measurement as StationingMeasurement;
    measurement.paintBody(geoCanvas, PAINT_STYLES);
  }

  // override paintLabel(
  //   labelCanvas: LabelCanvas,
  //   feature: Feature,
  //   shape: Shape,
  //   layer: Layer,
  //   map: Map,
  //   paintState: PaintState,
  // ) {
  //   if (paintState.level <= 1) return;

  //   const wrapper = feature.properties['measurementWrapper'] as MeasurementWrapper;
  //   const measurement = wrapper.measurement as StationingMeasurement;
  //   measurement.paintLabel(labelCanvas, PAINT_STYLES);

  //   if (!paintState.selected) return;
  //   if (feature.properties.measurementWrapper && feature.properties.measurementWrapper.name) {
  //     const label = feature.properties.measurementWrapper.name;
  //     let cssStyle = 'color: white;';
  //     cssStyle += 'white-space: nowrap;';
  //     const labelHTML = '<span style="' + cssStyle + '">' + label + '</span>';
  //     if (
  //       (shape.type === ShapeType.POINT || shape.type === ShapeType.POLYGON || shape.type === ShapeType.POLYLINE) &&
  //       shape.focusPoint
  //     ) {
  //       labelCanvas.drawLabel(labelHTML, shape.focusPoint, {} as PointLabelStyle);
  //     }
  //   }
  // }
}
