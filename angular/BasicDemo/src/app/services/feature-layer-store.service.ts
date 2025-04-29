import { InjectionToken } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { FeatureModel } from "@luciad/ria/model/feature/FeatureModel";
import { ModelFactory } from "../luciad-map/factories/ModelFactory";
import { Feature } from "@luciad/ria/model/feature/Feature";
import { WebGLMap } from "@luciad/ria/view/WebGLMap";
import { FeatureLayer } from "@luciad/ria/view/feature/FeatureLayer";
import { LayerFactory } from "../luciad-map/factories/LayerFactory";
import { ContextMenu } from "@luciad/ria/view/ContextMenu";
import { Map } from "@luciad/ria/view/Map";
import { MemoryStore } from "@luciad/ria/model/store/MemoryStore";
import { PoiPainter } from "../luciad-map/painters/PoiPainter";
import { FeaturePainter } from "@luciad/ria/view/feature/FeaturePainter";
import { PolygonAsPolylinePainter } from "../luciad-map/painters/PolygonAsPolylinePainter";
import { CustomClusteringPainter } from "../luciad-map/painters/CustomClusteringPainter";
import { create, createScaleDependent } from "@luciad/ria/view/feature/transformation/ClusteringTransformer";
import { CustomClusterShapeProvider } from "../luciad-map/painters/CustomClusterShapeProvider";
import { DocumentFilePainter } from "../luciad-map/painters/DocumentFilePainter";
import {MeasurementPainter} from "../luciad-map/painters/MeasurementPainter";

interface ModelChangedObject {
  modelChangeType: "add" | "update" | "remove";
  feature: Feature;
  id: number | string;
}

export interface GenericPOIType {
  id?: string;
  properties: {
    name: string;
    description: string;
    image: string;
    icon: string;
  }
  geometry: any;
}

interface LayerDescription {
  id: string;
  label: string;
  painter?: FeaturePainter;
}

const featurePainter = new PoiPainter();
const documentFilePainter = new DocumentFilePainter();

const DamagesSeverityClassification = {
  property: "class",
  classification: [
    { property: "class", value: 4, color: "red" },
    { property: "class", value: 3, color: "orange" },
    { property: "class", value: 2, color: "yellow" },
    { property: "class", value: 1, color: "white" },
  ]
}

const SensorsSeverityClassification = {
  property: "alarm_state",
  classification: [
    { property: "alarm_state", value: "alarm", color: "red" },
    { property: "alarm_state", value: "warning", color: "yellow" },
    { property: "alarm_state", value: "normal", color: "white" },
  ]
}

const DamagesClusterStyle = {
  normal: { stroke: 'red', severity: DamagesSeverityClassification },
  selected: { stroke: 'green', severity: DamagesSeverityClassification }
};
const SensorsClusterStyle = {
  normal: { stroke: 'yellow', severity: SensorsSeverityClassification },
  selected: { stroke: 'blue', severity: SensorsSeverityClassification }
};
const FilesClusterStyle = { normal: { stroke: 'white' }, selected: { stroke: 'white' } };
const MatterPortClusterStyle = { normal: { stroke: 'white' }, selected: { stroke: 'white' } };

const DamagesLayer: LayerDescription = {
  id: "damages-id",
  label: "Damages",
  painter: new CustomClusteringPainter(featurePainter, DamagesClusterStyle)
}
const SensorsLayer: LayerDescription = {
  id: "sensors-id",
  label: "Sensors",
  painter: new CustomClusteringPainter(featurePainter, SensorsClusterStyle)
}
const BoundaryLayer: LayerDescription = {
  id: "boundary-id",
  label: "Boundary",
  painter: new PolygonAsPolylinePainter()
}
const FilesLayer: LayerDescription = {
  id: "files-id",
  label: "Files",
  painter: new CustomClusteringPainter(documentFilePainter, FilesClusterStyle)
}
const MatterPort: LayerDescription = {
  id: "matterPort",
  label: "MatterPort",
  painter: new CustomClusteringPainter(featurePainter, MatterPortClusterStyle)
}

const Annotations: LayerDescription = {
  id: "annotations",
  label: "Annotations",
  painter: new MeasurementPainter()
}

export const DamagesStoreService = new InjectionToken<FeatureLayerStoreService>('DamagesStoreService', {
    factory: FeatureLayerStoreServiceFactory(DamagesLayer)
  }
);
export const SensorsStoreService = new InjectionToken<FeatureLayerStoreService>('SensorsStoreService', {
    factory: FeatureLayerStoreServiceFactory(SensorsLayer)
  }
);
export const BoundaryStoreService = new InjectionToken<FeatureLayerStoreService>('BoundaryStoreService', {
    factory: FeatureLayerStoreServiceFactory(BoundaryLayer)
  }
);
export const FilesStoreService = new InjectionToken<FeatureLayerStoreService>('FilesStoreService', {
    factory: FeatureLayerStoreServiceFactory(FilesLayer)
  }
);

export const MatterPortStoreService = new InjectionToken<FeatureLayerStoreService>('MatterPortStoreService', {
    factory: FeatureLayerStoreServiceFactory(MatterPort)
  }
);

export const AnnotationsStoreService = new InjectionToken<FeatureLayerStoreService>('AnnotationsStoreService', {
    factory: FeatureLayerStoreServiceFactory(Annotations)
  }
);



// create the factory
export function FeatureLayerStoreServiceFactory(layerInfo: LayerDescription) {
  return () => new FeatureLayerStoreService(layerInfo)
}

function createClusterTransformer() {
  return createScaleDependent({
    levelScales: [1 / 500],
    clusteringTransformers: [
      // @ts-ignore
      create({defaultParameters: {clusterShapeProvider: new CustomClusterShapeProvider()}}),
      // @ts-ignore
      create({defaultParameters: {clusterShapeProvider: new CustomClusterShapeProvider(), noClustering: true}})
    ]
  });
}

export class FeatureLayerStoreService {

  private subjectModel = new BehaviorSubject<FeatureModel | null>(null);
  private subjectContentChange = new Subject<ModelChangedObject>;
  private subjectShowFeature = new Subject<Feature>;
  private subjectFeatureClicked = new Subject<Feature>;
  private layerInfo: LayerDescription;
  private currentFilter: null | ((feature: Feature) => boolean | null) = null;

  constructor(layerInfo: LayerDescription) {
    this.layerInfo = layerInfo;
    ModelFactory.createMemoryFeatureModel({}).then(model => {
      model.on("ModelChanged", (modelChangeType: "add" | "update" | "remove", feature: Feature, id: number | string) => {
        const modelChangedOptions: ModelChangedObject = {
          modelChangeType,
          feature,
          id
        }
        this.subjectContentChange.next(modelChangedOptions);
      });
      this.subjectModel.next(model);
    })
  }

  getModel(): FeatureModel | null {
    return this.subjectModel.value;
  }

  // Called when the entire model is replaced
  onModelChange(): Observable<FeatureModel | null> {
    return this.subjectModel.asObservable();
  }

  // Called when one or more elements in the model have changed
  onContentChange(): Observable<ModelChangedObject> {
    return this.subjectContentChange.asObservable();
  }

  // This is a hook that is triggered whenever show is selected from context menu
  onShowFeature(): Observable<Feature> {
    return this.subjectShowFeature.asObservable();
  }

  // This is a hook that is triggered whenever a feature is clicked
  onFeatureClicked(): Observable<Feature> {
    return this.subjectFeatureClicked.asObservable();
  }

  onModelReady(): Observable<FeatureModel> {
    return new Observable<FeatureModel>(subscriber => {
      if (this.subjectModel.value) {
        subscriber.next(this.subjectModel.value);
      } else {
        this.onModelChange().subscribe((m) => {
          if (m) subscriber.next(m);
        })
      }
    });
  }

  getAll(): Observable<Feature[]> {
    return new Observable<Feature[]>(subscriber => {
      const model = this.getModel();
      if (!model) {
        subscriber.next([]);
      } else {
        const store = model.store as MemoryStore;
        const cursor = store.query();
        const features: Feature[] = [];
        while (cursor.hasNext()) {
          const feature = cursor.next();
          features.push(feature);
        }
        subscriber.next(features);
      }
    })
  }

  get(id: string): Observable<Feature> {
    return new Observable<Feature>(subscriber => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(undefined);
      } else {
        const store = model.store as MemoryStore;
        const feature = store.get(id);
        subscriber.next(feature);
      }
    })
  }

  delete(id: string): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(false);
      } else {
        const store = model.store as MemoryStore;
        const value = store.remove(id);
        subscriber.next(value);
      }
    })
  }

  deleteAll(): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(false);
      } else {
        const store = model.store as MemoryStore;
        const value = store.clear();
        subscriber.next(value);
      }
    })
  }

  put(feature: Feature): Observable<string> {
    return new Observable<string>(subscriber => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(undefined);
      } else {
        const store = model.store as MemoryStore;
        const value = store.put(feature) as string;
        subscriber.next(value);
      }
    })
  }

  add(feature: Feature): Observable<string> {
    return new Observable<string>(subscriber => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(undefined);
      } else {
        const store = model.store as MemoryStore;
        const value = store.add(feature) as string;
        subscriber.next(value);
      }
    })
  }

  public addFeatureLayerToMap(map: WebGLMap): Observable<FeatureLayer> {
    return new Observable<FeatureLayer>(subscriber => {
      if (!map) subscriber.next(undefined);
      this.onModelReady().subscribe(model => {
        if (!model) {
          subscriber.next(undefined);
        } else {
          const layer = map.layerTree.findLayerById(this.layerInfo.id) as FeatureLayer;
          if (layer) {
            this.moveLayerToTop(map, layer);
            subscriber.next(layer);
          } else {
            this.createNewLayerInMap(map).then(newLayer => subscriber.next(newLayer));
          }
        }
      })
    })
  }

  private createNewLayerInMap(map: WebGLMap) {
    return new Promise<FeatureLayer>(resolve => {
      const model = this.getModel();
      if (model) {
        const portAssetsLayerPromise = LayerFactory.createEditableFeatureLayer(model,
          {
            label: this.layerInfo.label,
            id: this.layerInfo.id,
            selectable: true,
            hoverable: true,
            editable: true
          });
        portAssetsLayerPromise.then(poiLayer => {
          poiLayer.painter = this.layerInfo.painter ? this.layerInfo.painter : new PoiPainter();
          if (poiLayer.painter instanceof CustomClusteringPainter) {
            poiLayer.transformer = createClusterTransformer();
          }
          (poiLayer as any).onMouseClick = (feature: Feature, layer: FeatureLayer) => {
            // @ts-ignore
            if (typeof feature.properties.clusteredElements === "undefined")
              this.subjectFeatureClicked.next(feature);
          }
          poiLayer.onCreateContextMenu = (contextMenu: ContextMenu, map: Map, contextMenuInfo: any) => {
            // contextMenu.addItem({label:"Edit", action: ()=>{
            //     this.editPoi(poiLayer, map, contextMenuInfo);
            //   }});
            // contextMenu.addItem({label:"Show", action: ()=>{
            //     this.showPoi(poiLayer, map, contextMenuInfo );
            //   }});
            // contextMenu.addItem({label:"Delete", action: ()=>{
            //     EditSelectLayerTools.deleteFeature(poiLayer, map, contextMenuInfo );
            //   }});
          };
          map.layerTree.addChild(poiLayer);
          resolve(poiLayer);
        })
      }
    })

  }

  private moveLayerToTop(map: WebGLMap, layer: FeatureLayer) {
    if (map) {
      map.layerTree.moveChild(layer, "top");
    }
  }

  private showPoi(poiLayer: FeatureLayer, map: Map, contextMenuInfo: any) {
    if (contextMenuInfo.objects.length > 0) {
      const feature = contextMenuInfo.objects[0];
      this.subjectShowFeature.next(feature);
    }
  }

  private editPoi(poiLayer: FeatureLayer, map: Map, contextMenuInfo: any) {
    if (contextMenuInfo.objects.length > 0) {
      const feature = contextMenuInfo.objects[0];
      this.subjectFeatureClicked.next(feature);
    }
  }
  public setFilter(map: WebGLMap, filter: (feature: Feature)=> boolean) {
    this.currentFilter = filter;
    const layer = map!.layerTree.findLayerById(this.layerInfo.id) as FeatureLayer;
    // @ts-ignore
    if (layer) layer.filter = this.currentFilter;
  }
  public resetFilter(map: WebGLMap) {
    this.currentFilter = null;
    const layer = map!.layerTree.findLayerById(this.layerInfo.id) as FeatureLayer;
    if (layer) layer.filter = this.currentFilter;
  }

  public getLayerInfo() {
    return this.layerInfo;
  }
}
