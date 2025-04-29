import {ClusterShapeProvider} from "@luciad/ria/view/feature/transformation/ClusterShapeProvider";
import {Feature} from "@luciad/ria/model/feature/Feature";
import {Shape} from "@luciad/ria/shape/Shape";
import {createPoint, createShapeList} from "@luciad/ria/shape/ShapeFactory";

export class CustomClusterShapeProvider extends ClusterShapeProvider {
    // @ts-ignore
  getShape(features: Feature[]) {
        if (!features || features.length===0) return;
        if (!features[0].shape) return ;
        // @ts-ignore
      return createShapeList(features[0].shape.reference, features.map(feature=>feature.shape)).focusPoint;
    }
}
