import { ClusterShapeProvider } from '@luciad/ria/view/feature/transformation/ClusterShapeProvider.js';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { createShapeList } from '@luciad/ria/shape/ShapeFactory.js';

export class CustomClusterShapeProvider extends ClusterShapeProvider {
  getShape(features: Feature[]) {
    if (!features || features.length === 0) return;
    return createShapeList(
      features[0].shape.reference,
      features.map((feature) => feature.shape.focusPoint),
    ).focusPoint;
  }
}
