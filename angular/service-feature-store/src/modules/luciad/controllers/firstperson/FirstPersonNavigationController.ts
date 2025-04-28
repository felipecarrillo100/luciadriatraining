import {
  FEATURE_CLICKED,
  InertialFirstPersonControllerConstructorOptions,
  MAP_CLICKED,
  MouseButtonsController,
  OPEN_CONTEXTMENU_EVENT,
} from './modularcontrollers/MouseButtonsController';
import { Map } from '@luciad/ria/view/Map';
import { Bounds } from '@luciad/ria/shape/Bounds';
import { createTopocentricReference } from '@luciad/ria/reference/ReferenceProvider';
import { ReferenceType } from '@luciad/ria/reference/ReferenceType.js';
import { createBounds } from '@luciad/ria/shape/ShapeFactory';
import { FocusSelectedFeatureOnKeyboardController } from '@pages/map/luciad-map/controllers/modularcontrollers/focuscameraonfeature/FocusSelectedFeatureOnKeyboardController';
import { IsolatedRotateZoomPanController } from '@pages/map/luciad-map/controllers/firstperson/modularcontrollers/IsolatedRotateZoomPanController';
import { Feature } from '@luciad/ria/model/feature/Feature';
import { FeatureLayer } from '@luciad/ria/view/feature/FeatureLayer';
import { MapAbstractController } from '@pages/map/luciad-map/controllers/panocontroller/MapAbstractController';
import { Point } from '@luciad/ria/shape/Point';
import { GestureEvent } from '@luciad/ria/view/input/GestureEvent';
import { ConfirmationDialogService } from '@shared/services/confirmation-dialog.service';
import { FEATURE_VALUE_CHANGED } from '@interfaces/app-state.interface';
import { Observable, take, tap } from 'rxjs';
import { Controller } from '@luciad/ria/view/controller/Controller';
import { SA_Ruler3DController } from '@pages/map/luciad-map/controllers/ruler3d/SA_Ruler3DController';
import { Edit3DPointController } from '@pages/map/luciad-map/controllers/editpoint/Edit3DPointController';
import { PickInfo } from '@luciad/ria/view/PickInfo';
import { WebGLMapExtended } from '@pages/map/services/main-map.service';

export class FirstPersonNavigationController extends MapAbstractController {
  public constructor(
    options: InertialFirstPersonControllerConstructorOptions,
    bounds: Bounds,
    private confirmationDialogService: ConfirmationDialogService,
  ) {
    super();

    if (bounds && bounds.reference?.referenceType === ReferenceType.GEOCENTRIC) {
      // SceneNavigationController bounds are defined in a geocentric reference.
      // These are not aligned to the earth surface and might give issues.
      // Switch to using topocentric navigation bounds
      const topoRef = createTopocentricReference({
        origin: bounds.focusPoint,
      });
      const diagonal = Math.sqrt(Math.pow(bounds.width, 2) + Math.pow(bounds.height, 2) + Math.pow(bounds.depth, 2));
      bounds = createBounds(topoRef, [-diagonal / 2, diagonal, -diagonal / 2, diagonal, -diagonal / 2, diagonal]);
    }

    const mouseButtonsController = new MouseButtonsController(options);

    mouseButtonsController.on(OPEN_CONTEXTMENU_EVENT, (p) => {
      const map = this.map as WebGLMapExtended;

      if (map && typeof map.onCreateCustomContextMenu === 'function') {
        map.onCreateCustomContextMenu(p);
      }
    });

    mouseButtonsController.on(FEATURE_CLICKED, (feature: Feature, layer: FeatureLayer, event: GestureEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = this.map as any;
      const { domEvent } = event;
      const shiftKey = (domEvent as MouseEvent | TouchEvent).shiftKey;

      const sa_ruler3dController = map.controller.delegates?.find(
        (controller: Controller) => controller instanceof SA_Ruler3DController,
      );

      if (
        (sa_ruler3dController && sa_ruler3dController.enabled) ||
        map.controller instanceof Edit3DPointController ||
        map.controller instanceof SA_Ruler3DController
      ) {
        return; // If we are in drawing mode, just draw
      }

      this.handleFeatureClick(feature, layer, shiftKey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (map && layer && typeof (layer as any).onMouseClick === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (layer as any).onMouseClick(feature, layer);
      }
    });

    mouseButtonsController.on(MAP_CLICKED, (point: Point, worldPoint: Point) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = this.map as any;

      const sa_ruler3dController = map.controller.delegates?.find(
        (controller: Controller) => controller instanceof SA_Ruler3DController,
      );

      if (map && typeof map.onMouseClick === 'function') {
        map.onMouseClick(point, worldPoint);
      }

      if (
        (sa_ruler3dController && sa_ruler3dController.enabled) ||
        map.controller instanceof Edit3DPointController ||
        map.controller instanceof SA_Ruler3DController
      ) {
        return; // If we are in drawing mode, just draw
      }

      this.handleMapClick();
    });

    // Context menu on map clicks
    this.appendController(mouseButtonsController);

    //  Adds zoom in/out with wheel
    this.appendController(new IsolatedRotateZoomPanController({}, bounds));

    // Focus feature on key pressed
    this.appendController(new FocusSelectedFeatureOnKeyboardController());
  }

  onActivate(map: Map) {
    super.onActivate(map);
    map.domNode.style.cursor = 'default';
  }

  private handleFeatureClick(feature: Feature, layer: FeatureLayer, shiftKey: boolean) {
    const itemDataChanged = sessionStorage.getItem(FEATURE_VALUE_CHANGED);

    if (itemDataChanged) {
      this.showAlert('feature_data_has_changed').subscribe((res: boolean) => {
        if (res) {
          this.selectFeatureOnClick(feature, layer, shiftKey);
        }
      });
    } else {
      this.selectFeatureOnClick(feature, layer, shiftKey);
    }
  }

  private handleMapClick(): void {
    const itemDataChanged = sessionStorage.getItem(FEATURE_VALUE_CHANGED);

    if (itemDataChanged) {
      this.showAlert('feature_data_has_changed').subscribe((res: boolean) => {
        if (res) {
          this.map.clearSelection();
        }
      });
    } else {
      this.map.clearSelection();
    }
  }

  private showAlert(message: string): Observable<boolean> {
    return this.confirmationDialogService.openConfirmationDialog(message, 'attention', 'proceed').pipe(
      take(1),
      tap((res) => {
        res && sessionStorage.removeItem(FEATURE_VALUE_CHANGED);
        return res;
      }),
    );
  }

  private selectFeatureOnClick(feature: Feature, layer: FeatureLayer, shiftKey: boolean) {
    const selection = [...this.map.selectedObjects];

    if (!shiftKey || selection.length === 0) {
      this.map.selectObjects([{ layer, objects: [feature] }]);
      return;
    }

    let newSelection: PickInfo[] = selection.map(({ layer, selected }) => ({
      layer: layer as FeatureLayer,
      objects: selected as Feature[],
    }));

    const existingSelection = newSelection.find((sel) => sel.layer.id === layer.id);

    if (!existingSelection) {
      // A different layer is selected – keep previous selection and add a new one
      newSelection.push({ layer, objects: [feature] });
    } else {
      // Toggle feature selection in the same layer
      const selectedObjects = existingSelection.objects;
      const isSelected = selectedObjects.some((f) => f.id === feature.id);

      existingSelection.objects = isSelected
        ? selectedObjects.filter((f) => f.id !== feature.id)
        : [...selectedObjects, feature];
    }

    newSelection = newSelection.filter((sel) => sel.objects.length > 0);

    this.map.selectObjects(newSelection);
  }
}
