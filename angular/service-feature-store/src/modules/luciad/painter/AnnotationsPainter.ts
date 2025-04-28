import { PaintState } from '@luciad/ria/view/feature/FeaturePainter';
import { GeoCanvas } from '@luciad/ria/view/style/GeoCanvas';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { Shape } from '@luciad/ria/shape/Shape';
import { Layer } from '@luciad/ria/view/Layer';
import { Map } from '@luciad/ria/view/Map';
import { MeasurementPainter } from './MeasurementPainter';
// import { TranslateService } from '@ngx-translate/core';

// const AStyle = {
//   selected: {
//     lineStyle: {
//       draped: false,
//       drapeTarget: DrapeTarget.ALL,
//       stroke: {
//         color: 'rgb(0,255,21)',
//         dashIndex: 'solid',
//         width: 2,
//       },
//     },
//     shapeStyle: {
//       draped: false,
//       // "drapeTarget": DrapeTarget.ALL,
//       fill: {
//         color: 'rgba(70,70,65,0.8)',
//       },
//       stroke: {
//         color: 'rgb(0, 255, 21)',
//         dashIndex: 'solid',
//         width: 2,
//       },
//     },
//     pointStyle: {
//       draped: false,
//       image: IconFactory.circle({
//         fill: 'rgba(255,0,0,1)',
//         stroke: 'rgba(255,255,255,1)',
//         width: 15,
//         height: 15,
//       }),
//       width: '28px',
//       height: '28px',
//     },
//   },
//   default: {
//     lineStyle: {
//       draped: false,
//       drapeTarget: DrapeTarget.ALL,
//       stroke: {
//         color: 'rgb(0, 128, 256)',
//         dashIndex: 'solid',
//         width: 2,
//       },
//     },
//     shapeStyle: {
//       draped: false,
//       // "drapeTarget": DrapeTarget.ALL,
//       fill: {
//         color: 'rgba(70,70,65,0.6)',
//       },
//       stroke: {
//         color: 'rgb(0, 128, 256)',
//         dashIndex: 'solid',
//         width: 2,
//       },
//     },
//     pointStyle: {
//       draped: false,
//       image: IconFactory.circle({
//         fill: 'rgba(255,0,0,1)',
//         stroke: 'rgba(255,255,255,1)',
//         width: 10,
//         height: 10,
//       }),
//       width: '24px',
//       height: '24px',
//     },
//   },
// };

export class AnnotationsPainter extends MeasurementPainter {
  override paintBody(
    geoCanvas: GeoCanvas,
    feature: Feature,
    shape: Shape,
    layer: Layer,
    map: Map,
    paintState: PaintState,
  ) {
    super.paintBody(geoCanvas, feature, shape, layer, map, paintState);
  }

  constructor(/*private translateService: TranslateService*/) {
    super();
  }

  // paintLabel(labelCanvas: LabelCanvas, feature: Feature, shape: Shape, layer: Layer, map: Map, paintState: PaintState) {
  //   super.paintLabel(labelCanvas, feature, shape, layer, map, paintState);

  //   if (!paintState.selected) return;
  //   const wrapper = feature.properties['measurementWrapper'] as MeasurementWrapper;
  //   if (wrapper.measurement instanceof StationingMeasurement) return;

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
