import { ShapeProvider } from '@luciad/ria/view/feature/ShapeProvider.js';
import { Feature } from '@luciad/ria/model/feature/Feature.js';
import { createPolyline } from '@luciad/ria/shape/ShapeFactory.js';
import { Point } from '@luciad/ria/shape/Point.js';
import { StationingMeasurement } from '../controllers/ruler3d/measurement/StationingMeasurement';

export class StationingShapeProvider extends ShapeProvider {
  constructor() {
    super();
  }

  provideShape(feature: Feature) {
    const measurement = feature.properties.measurementWrapper.measurement as StationingMeasurement;
    const points = measurement.points as Point[];
    if (points.length > 0) {
      const reference = points[0].reference;
      return createPolyline(reference, points);
    }
    return feature.shape;
  }
}
