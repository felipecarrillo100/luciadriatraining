import { Map } from '@luciad/ria/view/Map.js';
import { Bounds } from '@luciad/ria/shape/Bounds.js';
import { MapNavigatorAnimationOptions } from '@luciad/ria/view/MapNavigator.js';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera.js';
import { AnimationManager } from '@luciad/ria/view/animation/AnimationManager.js';
import { getReference } from '@luciad/ria/reference/ReferenceProvider.js';
import { WebGLMap } from '@luciad/ria/view/WebGLMap.js';
import {CRSEnum} from '../interfaces/CRS.enum';
import {MapFactory} from '../factories/MapFactory';
import {create3DCameraAnimation} from '../controllers/panocontroller/animation/Move3DCameraAnimation';

/****  This is a map navigation fit to bounds with navigation in straight line ***/
export function fitMapToBounds(
  map: Map,
  options: {
    bounds: Bounds;
    animate?: boolean | MapNavigatorAnimationOptions;
    fitMargin?: string;
    simple?: boolean;
  },
) {
  const catchError = () => console.log('Animation interrupted');
  if (!options.simple) {
    map?.mapNavigator
      .fit({
        bounds: options.bounds,
        animate: options.animate,
        fitMargin: options.fitMargin,
      })
      .catch(catchError);
  } else {
    // @ts-ignore
    const duration = typeof options.animate !== 'boolean' && options.animate.duration ? options.animate.duration : 800;
    const originalCamera = map.camera;
    map.mapNavigator.fit({ bounds: options.bounds, animate: false, fitMargin: options.fitMargin }).catch(catchError);
    const fitCamera = map.camera as PerspectiveCamera;
    map.camera = originalCamera;
    const animation = create3DCameraAnimation(map, fitCamera, duration);
    // @ts-ignore
    AnimationManager.putAnimation(map.cameraAnimationKey, animation, false).catch(catchError);
  }
}

/****  This is a map navigation fit to bounds with navigation in straight line ***/
export function fitMapToBoundsFromTop(
  map: Map,
  options: {
    bounds: Bounds;
    animate?: boolean | MapNavigatorAnimationOptions;
    fitMargin?: string;
    simple?: boolean;
  },
) {
  const catchError = () => console.log('Animation interrupted');
  if (!map.reference.equals(getReference(CRSEnum.EPSG_4978))) {
    map?.mapNavigator
      .fit({
        bounds: options.bounds,
        animate: options.animate,
        fitMargin: options.fitMargin,
      })
      .catch(catchError);
  } else {
    // @ts-ignore
    let duration = typeof options.animate !== 'boolean' && options.animate.duration ? options.animate.duration : 800;
    const originalCamera = map.camera;
    MapFactory.animateZoomOut(map as WebGLMap, 1).then(() => {
      map.mapNavigator
        .fit({
          bounds: options.bounds,
          animate: false,
          fitMargin: options.fitMargin,
        })
        .catch(catchError);
      const fitCamera = map.camera as PerspectiveCamera;
      map.camera = originalCamera;
      if (!options.animate) duration = 0;
      const animation = create3DCameraAnimation(map, fitCamera, duration);
      // @ts-ignore
      AnimationManager.putAnimation(map.cameraAnimationKey, animation, false).catch(catchError);
    });
  }
}
