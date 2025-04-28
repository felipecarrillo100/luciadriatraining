import { Controller } from '@luciad/ria/view/controller/Controller';
import { HandleEventResult } from '@luciad/ria/view/controller/HandleEventResult';
import { KeyEvent } from '@luciad/ria/view/input/KeyEvent';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { createBounds } from '@luciad/ria/shape/ShapeFactory';
import { fitMapToBounds } from '@pages/map/utils/FitMapToBounds';
import { Bounds } from '@luciad/ria/shape/Bounds';
import { cloneDeep } from 'lodash';

export class FocusSelectedFeatureOnKeyboardController extends Controller {
  constructor() {
    super();
  }

  onKeyEvent(keyEvent: KeyEvent): HandleEventResult {
    const { domEvent } = keyEvent;
    // if (this.map && domEvent?.ctrlKey && domEvent?.key === "f") {
    if (this.map && domEvent?.key === 'f') {
      const targetElement = domEvent.target as HTMLElement;
      const target = domEvent?.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        !targetElement.classList.contains('LuciadMap')
      ) {
        // Events on input targets are disregarded.
        return HandleEventResult.EVENT_IGNORED;
      }

      if (this.map.hoveredObjects.length > 0) {
        const firstFeature = this.map.hoveredObjects[0]?.hovered[0];
        if (firstFeature instanceof Feature) {
          const bounds = FocusSelectedFeatureOnKeyboardController.featureBounds(firstFeature);
          fitMapToBounds(this.map, { bounds, animate: true, fitMargin: '15%', simple: true });
          return HandleEventResult.EVENT_HANDLED;
        }
      } else if (this.map.selectedObjects.length > 0) {
        const firstFeature = this.map.selectedObjects[0]?.selected[0];
        if (firstFeature instanceof Feature) {
          const bounds = FocusSelectedFeatureOnKeyboardController.featureBounds(firstFeature);
          fitMapToBounds(this.map, { bounds, animate: true, fitMargin: '15%', simple: true });
          return HandleEventResult.EVENT_HANDLED;
        }
      }
    }
    return HandleEventResult.EVENT_IGNORED;
  }

  public static featureBounds(firstFeature: Feature, extendPanoBounds?: boolean): Bounds {
    const feature = cloneDeep(firstFeature);
    let bounds = feature.shape.bounds;
    if (
      firstFeature.properties.measurementWrapper &&
      firstFeature.properties.measurementWrapper.measurement &&
      firstFeature.properties.measurementWrapper.measurement.bounds
    ) {
      if (firstFeature.properties.measurementWrapper.measurement.points.length === 3) {
        if (
          firstFeature.properties.measurementWrapper.measurement.points[0].x !==
          firstFeature.properties.measurementWrapper.measurement.points[2].x
        ) {
          bounds = firstFeature.properties.measurementWrapper.measurement.bounds;
        } else {
          const delta = 1e-6;
          const deltaZ = 1;
          bounds = createBounds(bounds.reference, [
            bounds.x - delta,
            delta * 2,
            bounds.y - delta,
            delta * 2,
            bounds.z - deltaZ,
            deltaZ * 2,
          ]);
        }
      } else {
        bounds = firstFeature.properties.measurementWrapper.measurement.bounds;
      }
    }

    if (extendPanoBounds) {
      const delta = 0.000005;
      const deltaZ = 1;
      bounds = createBounds(bounds.reference, [
        bounds.x - delta,
        delta * 2,
        bounds.y - delta,
        delta * 2,
        bounds.z - deltaZ,
        deltaZ * 2,
      ]);
    }
    return bounds;
  }

  public static featureGroupBounds(features: Feature[]) {
    const bounds = features.map((feature) => this.featureBounds(feature, true));

    if (bounds.length === 0) return null;

    return this.joinBounds(bounds);
  }

  public static joinBounds(bounds: Bounds[]) {
    if (bounds.length === 0) return null;

    let result = bounds[0];
    for (let i = 1; i < bounds.length; i++) {
      const current = bounds[i];
      const minX = Math.min(result.x, current.x);
      const minY = Math.min(result.y, current.y);
      const minZ = Math.min(result.z, current.z);
      const maxX = Math.max(result.x + result.width, current.x + current.width);
      const maxY = Math.max(result.y + result.height, current.y + current.height);
      const maxZ = Math.max(result.z + result.depth, current.z + current.depth);

      result = createBounds(result.reference, [minX, maxX - minX, minY, maxY - minY, minZ, maxZ - minZ]);
    }

    return result;
  }
}
