import { ShapeProvider } from '@luciad/ria/view/feature/ShapeProvider.js';
import { Feature } from '@luciad/ria/model/feature/Feature.js';
import { createPolyline } from '@luciad/ria/shape/ShapeFactory.js';
import { Measurement } from '../controllers/ruler3d/measurement/Measurement';
import { Shape } from '@luciad/ria/shape/Shape.js';
import {EAnnotationsTypes} from '../interfaces/EAnnotationsTypes';

export class AnnotationsShapeProvider extends ShapeProvider {
  constructor() {
    super();
  }

  provideShape(feature: Feature) {
    const measurement = feature.properties.measurementWrapper.measurement as Measurement;
    switch (measurement.type) {
      case EAnnotationsTypes.Distance:
        return this.measurementAsLine(measurement, feature.shape);
      case EAnnotationsTypes.Area:
        return this.measurementAsArea(measurement, feature.shape);
      case EAnnotationsTypes.Orthogonal:
        return this.measurementAsArea(measurement, feature.shape);
    }
    return feature.shape;
  }

  private measurementAsLine(measurement: Measurement, fallbackShape: Shape) {
    const points = measurement.points;
    if (points.length > 0) {
      const reference = points[0].reference;
      return createPolyline(reference, points);
    }
    return fallbackShape;
  }

  private measurementAsArea(measurement: Measurement, fallbackShape: Shape) {
    const points = measurement.points;
    if (points.length > 0) {
      const reference = points[0].reference;
      return createPolyline(reference, points);
    }
    return fallbackShape;
  }
}
