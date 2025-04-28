import { WebGLMap } from '@luciad/ria/view/WebGLMap';
import { PerspectiveCamera } from '@luciad/ria/view/camera/PerspectiveCamera';
import {
  END_MOVE_TO_PANORAMA_EVENT,
  ENTERED_PANORAMA_MODE_EVENT,
  LEFT_PANORAMA_MODE_EVENT,
  PanoramaActions,
  START_MOVE_TO_PANORAMA_EVENT,
} from './PanoramaActions';
import { LayerFactory } from '../../../factories/LayerFactory';
import { getReference } from '@luciad/ria/reference/ReferenceProvider';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { Handle } from '@luciad/ria/util/Evented';
import {LuciadMapComponent} from '../../../../../app/components/luciad-map/luciad-map.component';
import {CRSEnum} from '../../../interfaces/CRS.enum';
import {MinimalisticPanoramicController} from '../MinimalisticPanoramicController';
import {MapAbstractController} from '../MapAbstractController';
import {OPEN_SIDE_PANEL_ON_FEATURE_CLICK} from '../PanoFeatureClickController';


interface ExtendedWebGLMap extends WebGLMap {
  _myPanoramaListeners?: { [key: string]: Handle };
  _myPanoramaActions?: PanoramaActions;
}

export function attachPanoToMap(
  map: WebGLMap,
  onPanoModeStatus: (entered: boolean) => void,
  onPanoAnimationStatus?: (entered: boolean) => void,
  onOpenPanoSidePanel?: (feature: Feature, layer: FeatureLayer) => void,
) {
  if (!(map?.camera instanceof PerspectiveCamera)) return;

  const myPanoramaActions = new PanoramaActions(map);

  (map as ExtendedWebGLMap)._myPanoramaActions = myPanoramaActions;

  const enteredListener = myPanoramaActions.on(ENTERED_PANORAMA_MODE_EVENT, () => {
    onPanoModeStatus(true);
  });

  const leftListener = myPanoramaActions.on(LEFT_PANORAMA_MODE_EVENT, () => {
    onPanoModeStatus(false);
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const startPanoramaMove = myPanoramaActions.on(START_MOVE_TO_PANORAMA_EVENT, (feature, layer) => {
    if (typeof onPanoAnimationStatus === 'function') onPanoAnimationStatus(true);
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const finalizedPanoramaMove = myPanoramaActions.on(END_MOVE_TO_PANORAMA_EVENT, (feature, layer) => {
    if (typeof onPanoAnimationStatus === 'function') onPanoAnimationStatus(false);
  });

  const openPanel = myPanoramaActions.on(OPEN_SIDE_PANEL_ON_FEATURE_CLICK, (feature, layer) => {
    onOpenPanoSidePanel(feature, layer);
  });

  (map as ExtendedWebGLMap)._myPanoramaListeners = {
    enteredListener,
    leftListener,
    startPanoramaMove,
    finalizedPanoramaMove,
    openPanel,
  };
}

export function detachPanoFromMap(map: ExtendedWebGLMap): void {
  if (!map) return;

  const panoramaListeners = map._myPanoramaListeners;
  if (panoramaListeners) {
    for (const key in panoramaListeners) {
      if (Object.prototype.hasOwnProperty.call(panoramaListeners, key)) {
        panoramaListeners[key].remove();
      }
    }

    delete map._myPanoramaActions;
    delete map._myPanoramaListeners;
  }
}

export function attachPanoControllerToMap(
  map: WebGLMap,
  confirmation: ConfirmationDialogService,
  luciadMapComponent?: LuciadMapComponent,
) {
  if (map) {
    const panoLayers = LayerFactory.findFusionPanoramaLayers(map);
    const panoActions = (map as ExtendedWebGLMap)._myPanoramaActions as PanoramaActions;

    if (map.reference.equals(getReference(CRSEnum.EPSG_4978))) {
      // Disables LuciadRIA navigation for 3D Maps and a custom will be used instead.
      map.defaultController = ControllerFactory.createDefaultControllerWithHover();
    } else {
      // Provides a default LuciadRIA navigation for 2D Maps
      map.defaultController = ControllerFactory.createDefaultControllerWithHoverAnd2DNavigation();
    }

    const newController = new MinimalisticPanoramicController(
      panoActions,
      panoLayers,
      confirmation,
    ) as MapAbstractController;

    if (
      luciadMapComponent &&
      luciadMapComponent.multipleVisibilityBoxSupport &&
      luciadMapComponent.showAllBoundsModeOn$.getValue()
    ) {
      const boxSelectController = new BoxSelectController(luciadMapComponent.multipleVisibilityBoxSupport);
      const referenceController = newController.getControllerByType(LookFromNavigationController);
      newController.appendControllerAfter(boxSelectController, referenceController);
    }
    map.controller = newController;

    if (panoLayers.length == 0) {
      console.info('No panoramic layers were found.');
    }
  }
}
