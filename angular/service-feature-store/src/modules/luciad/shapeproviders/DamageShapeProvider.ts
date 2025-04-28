import { ShapeProvider } from '@luciad/ria/view/feature/ShapeProvider.js';
import { Feature } from '@luciad/ria/model/feature/Feature.js';
export class DamageShapeProvider extends ShapeProvider {
  constructor() {
    super();
  }

  provideShape(feature: Feature) {
    return feature.shape.focusPoint;
  }
}
