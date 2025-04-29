import {Component, Inject, Input} from '@angular/core';
import {WebGLMap} from "@luciad/ria/view/WebGLMap";
import {Handle} from "@luciad/ria/util/Evented";
import {Controller} from "@luciad/ria/view/controller/Controller";
import {attachPanoControllerToMap} from "../luciad-map/controls/panocontroller/actions/PanoAttach";
import {PanoramicController} from "../luciad-map/controls/panocontroller/PanoramicController";
import {
  Measurement,
  MEASUREMENTS_MODEL_REFERENCE,
  MeasurementType
} from "../luciad-map/controls/ruler3d/measurement/Measurement";
import {MeasurementProjector} from "../luciad-map/controls/ruler3d/ThreePointProjector";
import {MEASUREMENT_FINISHED_EVENT, SA_Ruler3DController} from "../luciad-map/controls/ruler3d/SA_Ruler3DController";
import {createMeasurement} from "../luciad-map/controls/ruler3d/measurement/MeasurementUtil";
import {PAINT_STYLES} from "../luciad-map/painters/MeasurementPainter";
import {LookFromNavigationController} from "../luciad-map/controls/panocontroller/LookFromNavigationController";
import {CreateFeatureInLayerController} from "../luciad-map/controls/edit/CreateFeatureInLayerController";
// import {GenericPOIType, PoiStoreServiceService} from "../services/poi-store-service.service";
import {
  LabelAnnotationController,
  POINT_CREATION_EVENT
} from "../luciad-map/controls/annotations/LabelAnnotationController";

import {Point} from "@luciad/ria/shape/Point";
import {Feature} from "@luciad/ria/model/feature/Feature";
import GeoTools from "../luciad-map/utils/GeoTools";
import {
  DamagesStoreService, FilesStoreService,
  FeatureLayerStoreService,
  SensorsStoreService, AnnotationsStoreService
} from "../services/feature-layer-store.service";
import {MeasurementWrapper} from "../interfaces/MeasurementWrapper";
import {PerspectiveCamera} from "@luciad/ria/view/camera/PerspectiveCamera";
import {PersistedMeasurement, toSimpleLookFrom, toSimpleVector3} from "../interfaces/MeasurementPersistenceUtil";
import {createPoint} from "@luciad/ria/shape/ShapeFactory";
import {clamp, interpolate} from "../luciad-map/controls/util/Math";
import {easeInOutCubic} from "../luciad-map/controls/util/Easing";
import {AnimationManager} from "@luciad/ria/view/animation/AnimationManager";
import {create3DCameraAnimation} from "../luciad-map/controls/panocontroller/animation/Move3DCameraAnimation";

const AMeasurement: PersistedMeasurement = {
  "id": "7d26c1ea-7f5b-4fc2-a9b4-2e71d3a73d06",
  "name": "A sample measurement",
  "expanded": true,
  "fitPosition": {
    "eye": {
      "x": 4308527.320519641,
      "y": 629513.1294325532,
      "z": 4645631.857156845
    },
    "pitch": -23.000027900275704,
    "yaw": 35.26378108178108,
    "roll": 8.537736462515939e-7
  },
  "measurement": {
    "type": "Area" as any,
    "points": [
      {
        "x": 8.312796271395749,
        "y": 47.046333607833496,
        "z": 496.1889580665156
      },
      {
        "x": 8.312860395422696,
        "y": 47.046295300029364,
        "z": 496.28783784992993
      },
      {
        "x": 8.312858759914496,
        "y": 47.04629544896557,
        "z": 491.184314516373
      },
      {
        "x": 8.312796716583822,
        "y": 47.04633261026541,
        "z": 490.36226571165025
      }
    ]
  }
}



function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
@Component({
  selector: 'app-controllers',
  templateUrl: './controllers.component.html',
  styleUrls: ['./controllers.component.css']
})
export class ControllersComponent {
  private _map: WebGLMap | null = null ;
  private currentController: Controller | null | undefined;
  private handles: { ControllerChanged: Handle } | null = null;

  constructor(
  @Inject(DamagesStoreService) private damagesStoreService: FeatureLayerStoreService,
  @Inject(SensorsStoreService) private sensorsStoreService: FeatureLayerStoreService,
  @Inject(FilesStoreService) private documentsStoreService: FeatureLayerStoreService,
  @Inject(AnnotationsStoreService) private annotationsStoreService: FeatureLayerStoreService,
) {
    damagesStoreService.onShowFeature().subscribe(feature=>{
      console.log("Damage", feature);
    });
    sensorsStoreService.onShowFeature().subscribe(feature=>{
      console.log("Sensor", feature);
    })
    documentsStoreService.onShowFeature().subscribe(feature=>{
      console.log("Document", feature);
    })

    const measurementWrapper = this.restoreFromPersistantObject(AMeasurement);
    const feature = new Feature(
      measurementWrapper.measurement.focusPoint,
      {measurementWrapper},
      measurementWrapper.id
    )
      setTimeout(()=>{
        this.annotationsStoreService.put(feature).subscribe(()=>{
          if (this._map) {
            this.fitOn(measurementWrapper);
          }
          this._map && this.annotationsStoreService.addFeatureLayerToMap(this._map).subscribe();
        });
      }, 10000)
  }

  protected fitOn({fitPosition}: MeasurementWrapper) {
    if (!this._map) return;
    AnimationManager.putAnimation(
      this._map.cameraAnimationKey,
      create3DCameraAnimation(
        this._map,
        (this._map.camera as PerspectiveCamera).lookFrom(fitPosition),
        3000
      ),
      false
    );
  }

  protected restoreFromPersistantObject(AMeasurement: PersistedMeasurement) {
    const measurementWrapper = {
      id: AMeasurement.id,
      name: AMeasurement.name,
      expanded: AMeasurement.expanded,
      fitPosition: AMeasurement.fitPosition,
      measurement: createMeasurement(
        AMeasurement.measurement.type as any,
        AMeasurement.measurement.points.map(({x, y, z}) =>
          createPoint(MEASUREMENTS_MODEL_REFERENCE, [x, y, z])
        )
      ),
    }
    return measurementWrapper;
  }

  @Input()
  get map() {
    return this._map;
  }
  set map(value: WebGLMap | null) {
    if (this._map) {
      this.releaseListeners();
      this._map = null;
    } else {
      this._map = value;
      this.createListeners();
    }
  }

  private createListeners() {
    if (this.map) {
      const ControllerChanged = this.map.on("ControllerChanged", () => {
        this.currentController = this.map?.controller;
      });
      this.handles = {
        ControllerChanged
      }
    }
  }
  private releaseListeners = () => {
    if (this.handles){
      for (const key in this.handles) {
        if (this.handles.hasOwnProperty(key)) {
          // @ts-ignore
          const handle = this.handles[key] as Handle;
          handle?.remove;
        }
      }
      this.handles = null;
    }
  }

  isCurrentControl(control: "default" | "ruler" | "poi" | "annotation") {
    switch (control) {
      case "default":
        return this.currentController instanceof PanoramicController;
        break;
      case "ruler":
        return this.isRulerControllerEnabled();
        break;
      case "poi":
        return this.currentController instanceof CreateFeatureInLayerController;
      case "annotation":
        return this.currentController instanceof LabelAnnotationController;
    }
    return false;
  }

  setRulerController(type: MeasurementType) {
    if (this.map) {
      this.toggleRulerController(this.map, type);
    }
  }

  setPoiController(mode: 'sensor' | 'damage' | 'document') {
    const map = this.map;
    if (map) {
      let icon = "./assets/icons/explosion.png"
      let service = this.damagesStoreService;
      switch (mode) {
        case "sensor":
           icon = "./assets/icons/motion-sensor.png";
           service = this.sensorsStoreService;
          break;
        case "damage":
          icon = "./assets/icons/explosion.png";
          service = this.damagesStoreService;
          break;
        case "document":
          icon = "./assets/icons/documentation.png"
          service = this.documentsStoreService;
          break;
      }
      service.addFeatureLayerToMap(map).subscribe(layer => {
        const asset: any = {
          properties: {
            name: "POI",
            description: "some text",
            image: "https://www.ge.com/digital/sites/default/files/2020-02/APM-Reliability-banner-1404x3200.jpg",
            icon
          },
          geometry: {}
        }
        if (map && layer) {
          const controller = new LabelAnnotationController();
          controller.on(POINT_CREATION_EVENT, (point: Point) => {
            const point84 = GeoTools.reprojectPoint3D(point);
            const feature = new Feature(point84, asset.properties) as Feature;
            // @ts-ignore
            // layer.model.store.add(feature as Feature);
            service.add(feature as Feature).subscribe();
            this.setDefaultController();
          })
          map.controller = controller;
        }
      })
    }
  }

  setDefaultController() {
    if (this.map) attachPanoControllerToMap(this.map);
  }

  private toggleRulerController(map: WebGLMap, type: MeasurementType) {
    if (map.controller instanceof PanoramicController) {
      const panoramicController = map.controller as PanoramicController;
      const ruler3DController = panoramicController.getControllerByType(SA_Ruler3DController) as SA_Ruler3DController;
      if (ruler3DController) {
        this.setDefaultController();
      } else {
        map.controller=null;
        const referenceController = panoramicController.getControllerByType(LookFromNavigationController) as LookFromNavigationController;
        const controller = this.createRulerController(map, type);
        panoramicController.appendControllerAfter(controller, referenceController );
        map.controller = panoramicController;
      }
    }
  }

  private isRulerControllerEnabled() {
    if (!this.map) return false;
    const map = this.map;
    if (map.controller instanceof PanoramicController) {
      const panoramicController = map.controller as PanoramicController;
      const ruler3DController = panoramicController.getControllerByType(SA_Ruler3DController) as SA_Ruler3DController;
      if (!ruler3DController) return false;
      return ruler3DController.enabled;
    }
    return false;
  }

  private createRulerController(map: WebGLMap, type: MeasurementType) {
    const maxSegments = undefined;
    let projector: MeasurementProjector | undefined;
    const controller = new SA_Ruler3DController(createMeasurement(type), {
      styles: PAINT_STYLES,
      maxSegments,
      projector,
    });

    controller.on(MEASUREMENT_FINISHED_EVENT, (measurement: Measurement) => {
      console.log("Add new item!!!");
      console.log(measurement);
      if (!this._map) return;
      const fitPosition = (
        this._map.camera as PerspectiveCamera
      ).asLookFrom();
      const measurementWrapper: MeasurementWrapper = {
        id: uuidv4(),
        name: "abc",
        measurement,
        fitPosition,
        expanded: true,
      };
      const feature = new Feature(
        measurement.focusPoint,
        {measurementWrapper},
        measurementWrapper.id
      )
      const persistableObject = this.saveToDB(measurementWrapper);
      console.log(JSON.stringify(persistableObject, null, 2));
      this.annotationsStoreService.put(feature).subscribe(()=>{
        this._map && this.annotationsStoreService.addFeatureLayerToMap(this._map).subscribe();
      });
    });

    return controller;
  }

  protected saveToDB(wrapper: MeasurementWrapper) {
    const persistingObject: PersistedMeasurement = {
      id: wrapper.id,
      name: wrapper.name,
      expanded: wrapper.expanded,
      fitPosition: toSimpleLookFrom(wrapper.fitPosition),
      measurement: {
        type: wrapper.measurement.type,
        points: wrapper.measurement.getPointListCopy().map(toSimpleVector3),
      },
    };
    return persistingObject;
  }


  protected readonly MeasurementType = MeasurementType;

  isCurrentMeasureControl(measurementType: MeasurementType) {
    if (!this.map) return false;
    const map = this.map;
    if (map.controller instanceof PanoramicController) {
      const panoramicController = map.controller as PanoramicController;
      const ruler3DController = panoramicController.getControllerByType(SA_Ruler3DController) as SA_Ruler3DController;
      if (!ruler3DController) return false;
      return ruler3DController.measurement.type === measurementType;
    }
    return false;
  }
}
