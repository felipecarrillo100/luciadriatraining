import {EditController, EditControllerConstructorOptions} from "@luciad/ria/view/controller/EditController";
import {Feature} from "@luciad/ria/model/feature/Feature";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {CustomPolylineEditor} from "./CustomPolylineEditor";

export class CustomEditController extends EditController {
  constructor(layer: FeatureLayer,     feature: Feature, options?: EditControllerConstructorOptions) {
    const op = options ? options : {};
    super(layer, feature, {
      editor: new CustomPolylineEditor(),
      ...options
    });
  }
}
