import { Map } from '@luciad/ria/view/Map';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { ShapeType } from '@luciad/ria/shape/ShapeType';
import { CreateFeatureInLayerController } from './CreateFeatureInLayerController';
import { EditController } from '@luciad/ria/view/controller/EditController';
import { Controller } from '@luciad/ria/view/controller/Controller';
import { CustomEditController } from './custom/CustomEditController';
import { Feature } from '@luciad/ria/model/feature/Feature';

interface MapExtended extends Map {
  defaultController?: Controller;
}

export class EditSelectLayerTools {
  public static createAnyShape(map: Map, layer: FeatureLayer, shapeType: ShapeType, properties?: unknown) {
    let defaultProperties = {};
    map.selectObjects([]);
    if (properties) {
      defaultProperties = { ...defaultProperties };
    }
    const defaultController = (map as MapExtended).defaultController;
    const createController = new CreateFeatureInLayerController(shapeType, defaultProperties, layer, defaultController);
    map.controller = createController;
  }

  public static editFeature(
    layer: FeatureLayer,
    map: Map,
    contextMenuInfo: { objects: Feature[] },
    fallbackController?: Controller,
  ) {
    const editController = new CustomEditController(layer, contextMenuInfo.objects[0], {
      finishOnSingleClick: true,
    });
    editController.onDeactivate = (...args) => {
      const promise = new Promise<void>((resolve) => {
        EditController.prototype.onDeactivate.apply(editController, args);
        if (typeof fallbackController !== 'undefined') {
          map.controller = fallbackController;
        } else {
          map.controller = null;
        }
        resolve();
      });
      return promise;
    };
    map.controller = editController;
  }

  public static deleteFeature(
    layer: FeatureLayer,
    map: Map,
    contextMenuInfo: { layer: FeatureLayer; objects: Feature[] },
  ) {
    const id = contextMenuInfo.objects[0].id;
    if (contextMenuInfo.layer.model.remove) {
      contextMenuInfo.layer.model.remove(id);
    } else {
      console.error('Layer can not be edited:' + contextMenuInfo.layer.label);
    }
  }
}
