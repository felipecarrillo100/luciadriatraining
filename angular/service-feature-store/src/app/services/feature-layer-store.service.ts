import {inject, Injectable, InjectionToken } from '@angular/core';
import { Feature } from '@luciad/ria/model/feature/Feature.js';
import { FeaturePainter } from '@luciad/ria/view/feature/FeaturePainter.js';
import { ShapeProvider } from '@luciad/ria/view/feature/ShapeProvider.js';
import {FeatureLayer} from '@luciad/ria/view/feature/FeatureLayer.js';
import {create, createScaleDependent } from '@luciad/ria/view/feature/transformation/ClusteringTransformer.js';
import {ModelFactory} from '../../modules/luciad/factories/ModelFactory';
import { FeatureModel } from '@luciad/ria/model/feature/FeatureModel.js';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {MemoryStore} from '@luciad/ria/model/store/MemoryStore.js';
import { WebGLMap } from '@luciad/ria/view/WebGLMap.js';
import { LayerFactory } from '../../modules/luciad/factories/LayerFactory';
import { DA_DamageAnnotationPainter } from '../../modules/luciad/painter/distannce/DA_DamageAnnotationPainter';
import { PolygonAsPolylinePainter } from '../../modules/luciad/painter/PolygonAsPolylinePainter';
import {DA_DocumentFilePainter} from '../../modules/luciad/painter/distannce/DA_DocumentFilePainter';
import { AnnotationsPainter } from '../../modules/luciad/painter/AnnotationsPainter';
import { StationingPainter } from '../../modules/luciad/painter/StationingPainter';
import {ExternalDataEntityPainter} from '../../modules/luciad/painter/ExternalDataEntityPainter';
import {CustomClusteringPainter} from '../../modules/luciad/painter/CustomClusteringPainter';
import {PoiPainter} from '../../modules/luciad/painter/PoiPainter';
import {EPreviewSelected} from '../../modules/luciad/interfaces/EPreviewSelected';
import { DamageShapeProvider } from '../../modules/luciad/shapeproviders/DamageShapeProvider';
import {AnnotationsShapeProvider} from '../../modules/luciad/shapeproviders/AnnotationsShapeProvider';
import {StationingShapeProvider} from '../../modules/luciad/shapeproviders/StationingShapeProvider';
import {MainMapService} from './main-map.service';
import {CustomClusterShapeProvider} from '../../modules/luciad/painter/CustomClusterShapeProvider';


interface ModelChangedObject {
  modelChangeType: 'add' | 'update' | 'remove';
  feature: Feature;
  id: number | string;
}

export interface LayerDescription {
  id: string;
  label: string;
  featureType?: EPreviewSelected;
  painter?: FeaturePainter;
  shapeProvider?: ShapeProvider;
}

const featurePainter = new PoiPainter();

const MixedSeverityClassification = {
  property: null,
  classification: [
    {
      property: null,
      value: 'document',
      color: 'white',
      iconUrl: '/assets/icons/mixed/cluster/default/mixed_cluster.png',
    },
  ],
};

const MatterPortClusterStyle = {
  normal: { stroke: 'white', severity: MixedSeverityClassification, scaleIcon: 4 },
  selected: { stroke: 'white', severity: MixedSeverityClassification, scaleIcon: 4 },
};

export enum ELayerId {
  damages = 'damages-id',
  boundary = 'boundary-id',
  files = 'files-id',
  matterPort = 'matterPort',
  annotations = 'annotations',
  stationing = 'stationing',
  generic = 'generic-id',
  panorama = 'panorama', // need for multiple tool only
}

const DamagesLayer: LayerDescription = {
  id: ELayerId.damages,
  label: EPreviewSelected.Damage,
  // @ts-ignore
  shapeProvider: new DamageShapeProvider(),
};

const BoundaryLayer: LayerDescription = {
  id: ELayerId.boundary,
  label: 'Boundary',
};
const FilesLayer: LayerDescription = {
  id: ELayerId.files,
  label: EPreviewSelected.File,
};
const MatterPort: LayerDescription = {
  id: ELayerId.matterPort,
  label: 'MatterPort',
};

const Annotations: LayerDescription = {
  id: ELayerId.annotations,
  label: EPreviewSelected.Annotation,
  // @ts-ignore
  shapeProvider: new AnnotationsShapeProvider(),
};

const Stationings: LayerDescription = {
  id: ELayerId.stationing,
  label: EPreviewSelected.Stationing,
  // @ts-ignore
  shapeProvider: new StationingShapeProvider(),
};

const GenericLayer: LayerDescription = {
  id: ELayerId.generic,
  label: EPreviewSelected.ExternalDataEntity,
};

export const DamagesStoreService = new InjectionToken<FeatureLayerStoreService>('DamagesStoreService', {
  providedIn: 'root',
  factory: () =>
    inject(FeatureLayerStoreServiceFactory)(DamagesLayer),
});

export const BoundaryStoreService = new InjectionToken<FeatureLayerStoreService>('BoundaryStoreService', {
  providedIn: 'root',
  factory: () => inject(FeatureLayerStoreServiceFactory)(BoundaryLayer),
});

// export const FilesStoreService = new InjectionToken<FeatureLayerStoreService>('FilesStoreService', {
//   providedIn: 'root',
//   factory: () => inject(FeatureLayerStoreServiceFactory)(FilesLayer)
// });

export const FilesStoreService = new InjectionToken<FeatureLayerStoreService>('FilesStoreService', {
    factory: FeatureLayerStoreServiceFactory(FilesLayer)
  }
);

export const MatterPortStoreService = new InjectionToken<FeatureLayerStoreService>('MatterPortStoreService', {
  providedIn: 'root',
  factory: () => inject(FeatureLayerStoreServiceFactory)(MatterPort),
});
export const AnnotationsStoreService = new InjectionToken<FeatureLayerStoreService>('AnnotationsStoreService', {
  providedIn: 'root',
  factory: () => inject(FeatureLayerStoreServiceFactory)(Annotations),
});

export const StationingStoreService = new InjectionToken<FeatureLayerStoreService>('StationingStoreService', {
  providedIn: 'root',
  factory: () => inject(FeatureLayerStoreServiceFactory)(Stationings),
});
export const GenericStoreService = new InjectionToken<FeatureLayerStoreService>('GenericStoreService', {
  providedIn: 'root',
  factory: () => inject(FeatureLayerStoreServiceFactory)(GenericLayer),
});

export function FeatureLayerStoreServiceFactory(
  layerInfo: LayerDescription,
  // translateService: TranslateService,
  // measurement: MeasurementUnitsService,
) {
  return () => new FeatureLayerStoreService(layerInfo);
}

interface ClickableLayer {
  onMouseClick: (feature: Feature, layer: FeatureLayer) => void;
}

function createClusterTransformer() {
  return createScaleDependent({
    levelScales: [1 / 500],
    clusteringTransformers: [
      create({ defaultParameters: { clusterShapeProvider: new CustomClusterShapeProvider() } }),
      create({
        defaultParameters: { clusterShapeProvider: new CustomClusterShapeProvider(), noClustering: true },
      }),
    ],
  });
}

@Injectable({
  providedIn: 'root',
})
export class FeatureLayerStoreService {
  private mainMapService: MainMapService = inject(MainMapService);

  private readonly subjectModel = new BehaviorSubject<FeatureModel | null>(null);
  private readonly subjectContentChange = new Subject<ModelChangedObject>();
  private readonly subjectFeatureClicked = new Subject<Feature>();
  private readonly layerInfo: LayerDescription;
  // private readonly translateService: TranslateService;
  // private readonly measurementUnitsService: MeasurementUnitsService;
  private currentFilter: (feature: Feature) => boolean | null = null;

  public constructor(
    layerInfo: LayerDescription
    // translateFactory: TranslateService,
    // measurementUnitsService?: MeasurementUnitsService,
  ) {
    this.layerInfo = layerInfo;
    // this.translateService = translateFactory;
    // this.measurementUnitsService = measurementUnitsService;
    ModelFactory.createMemoryFeatureModel({}).then((model) => {
      model.on(
        'ModelChanged',
        (modelChangeType: 'add' | 'update' | 'remove', feature: Feature, id: number | string) => {
          const modelChangedOptions: ModelChangedObject = {
            modelChangeType,
            feature,
            id,
          };
          this.subjectContentChange.next(modelChangedOptions);
        },
      );
      this.subjectModel.next(model);
    });
  }



  public getModel(): FeatureModel | null {
    return this.subjectModel.value;
  }

  // Called when the entire model is replaced
  public onModelChange(): Observable<FeatureModel | null> {
    return this.subjectModel.asObservable();
  }

  public onContentChanged() {
    return this.subjectContentChange.asObservable()
  }

  // This is a hook that is triggered whenever a feature is clicked
  public onFeatureClicked(): Observable<Feature> {
    return this.subjectFeatureClicked.asObservable();
  }

  public onModelReady(): Observable<FeatureModel> {
    return new Observable<FeatureModel>((subscriber) => {
      if (this.subjectModel.value) {
        subscriber.next(this.subjectModel.value);
      } else {
        this.onModelChange().subscribe({
          next: (m) => {
            if (m) subscriber.next(m);
          },
        });
      }
    });
  }

  public getParticularFeatureById(itemId: number): Observable<Feature> {
    return new Observable<Feature>((subscriber) => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(null);
      } else {
        const store = model.store as MemoryStore;
        const cursor = store.query();
        let feature: Feature;
        while (!feature && cursor.hasNext()) {
          const f = cursor.next();
          if (f.properties.id === itemId) {
            feature = f;
          }
        }
        subscriber.next(feature);
      }
    });
  }

  public getParticularFeaturesByIds(ids: unknown[]): Observable<Feature[]> {
    return new Observable<Feature[]>((subscriber) => {
      const model = this.getModel();
      if (!model || !ids) {
        subscriber.next([]);
      } else {
        const store = model.store as MemoryStore;
        const cursor = store.query();
        const features: Feature[] = [];
        while (cursor.hasNext()) {
          const f = cursor.next();
          if (ids.includes(f.properties.id || f.id)) {
            features.push(f);
          }
        }
        subscriber.next(features);
      }
    });
  }

  public getAllFeaturesByAsset(assetId: number): Observable<Feature[]> {
    return new Observable<Feature[]>((subscriber) => {
      const model = this.getModel();
      if (!model) {
        subscriber.next([]);
      } else {
        const store = model.store as MemoryStore;
        const cursor = store.query();
        const features: Feature[] = [];
        while (cursor.hasNext()) {
          const f = cursor.next();
          if (f.properties["asset"] === assetId) {
            features.push(f);
          }
        }
        subscriber.next(features);
      }
    });
  }

  public getParticularFeaturesWithMeasurementWrapperByIds(ids: unknown[]): Observable<Feature[]> {
    return new Observable<Feature[]>((subscriber) => {
      const model = this.getModel();
      if (!model) {
        subscriber.next([]);
      } else {
        const store = model.store as MemoryStore;
        const cursor = store.query();
        const features: Feature[] = [];
        while (cursor.hasNext()) {
          const f = cursor.next();
          if (ids.includes(f.properties["measurementWrapper"].id)) {
            features.push(f);
          }
        }
        subscriber.next(features);
      }
    });
  }

  public get(id: string): Observable<Feature> {
    return new Observable<Feature>((subscriber) => {
      const model = this.getModel();
      if (!model) {
        // @ts-ignore
        subscriber.next(undefined);
      } else {
        const store = model.store as MemoryStore;
        const feature = store.get(id);
        // @ts-ignore
        subscriber.next(feature);
      }
    });
  }

  public delete(id: string): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(false);
      } else {
        const store = model.store as MemoryStore;
        const value = store.remove(id);
        subscriber.next(value);
      }
    });
  }

  public deleteByIdProperty(id: number): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(false);
        subscriber.complete();
        return;
      }

      const store = model.store as MemoryStore;
      const cursor = store.query(); // Get all stored features

      let deleted = false;
      while (cursor.hasNext()) {
        const feature = cursor.next();

        if (feature.properties.id === id || feature.id === id) {
          store.remove(feature.id);
          deleted = true;
          break;
        }
      }

      subscriber.next(deleted);
      subscriber.complete();
    });
  }

  public deleteAll(): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(false);
      } else {
        const store = model.store as MemoryStore;
        const value = store.clear();
        subscriber.next(value);
      }
    });
  }

  public put(feature: Feature): Observable<string> {
    return new Observable<string>((subscriber) => {
      const model = this.getModel();
      if (!model) {
        // @ts-ignore
        subscriber.next(undefined);
      } else {
        const store = model.store as MemoryStore;
        const value = store.put(feature) as string;
        subscriber.next(value);
      }
    });
  }

  public updateFeatureProperties(updatedData: {
    id: string | number;
    part?: number;
    partName?: string;
  }): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(false);
        subscriber.complete();
        return;
      }

      const store = model.store as MemoryStore;
      const cursor = store.query();

      let updated = false;

      while (cursor.hasNext()) {
        const feature = cursor.next();

        if (feature.id === updatedData.id) {
          if (updatedData.part) {
            feature.properties.part = updatedData.part;
          }
          if (updatedData.partName) {
            feature.properties["partName"] = updatedData.partName;
          }
          store.put(feature);
          updated = true;
          break;
        }
      }

      subscriber.next(updated);
      subscriber.complete();
    });
  }

  public putMultiple(features: Feature[]): Observable<string[]> {
    return new Observable<string[]>((subscriber) => {
      const model = this.getModel();
      if (!model || !features.length) {
        subscriber.next([]);
        return;
      }

      const store = model.store as MemoryStore;
      const result = features.map((feature) => store.put(feature) as string);

      subscriber.next(result);
    });
  }

  public add(feature: Feature): Observable<string> {
    return new Observable<string>((subscriber) => {
      const model = this.getModel();
      if (!model) {
        // @ts-ignore
        subscriber.next(undefined);
      } else {
        const store = model.store as MemoryStore;
        const value = store.add(feature) as string;
        subscriber.next(value);
      }
    });
  }

  public addFeatureLayerToMap(map: WebGLMap): Observable<FeatureLayer> {
    return new Observable<FeatureLayer>((subscriber) => {
      // @ts-ignore
      if (!map) subscriber.next(undefined);
      this.onModelReady().subscribe({
        next: (model) => {
          if (!model) {
            // @ts-ignore
            subscriber.next(undefined);
          } else {
            const layer = map.layerTree.findLayerById(this.layerInfo.id) as FeatureLayer;
            if (layer) {
              this.moveLayerToTop(map, layer);
              subscriber.next(layer);
            } else {
              this.createNewLayerInMap(map).then((newLayer) => subscriber.next(newLayer));
            }
          }
        },
      });
    });
  }

  private createNewLayerInMap(map: WebGLMap) {
    return new Promise<FeatureLayer>((resolve) => {
      const model = this.getModel();
      if (model) {
        const portAssetsLayerPromise = LayerFactory.createEditableFeatureLayer(model, {
          label: this.layerInfo.label,
          id: this.layerInfo.id,
          selectable: true,
          hoverable: true,
          editable: true,
        });
        portAssetsLayerPromise.then((poiLayer) => {
          const painterMap: { [key: string]: FeaturePainter } = {
            // @ts-ignore
            [ELayerId.damages]: new DA_DamageAnnotationPainter(
              null,
              // this.translateService,
              // this.measurementUnitsService,
            ),
            // @ts-ignore
            [ELayerId.boundary]: new PolygonAsPolylinePainter(this.translateService),
            // @ts-ignore
            [ELayerId.files]: new DA_DocumentFilePainter(null, this.translateService),
            // @ts-ignore
            [ELayerId.annotations]: new AnnotationsPainter(this.translateService),
            // @ts-ignore
            [ELayerId.stationing]: new StationingPainter(this.translateService),
            // @ts-ignore
            [ELayerId.generic]: new ExternalDataEntityPainter(null, this.translateService),
            // @ts-ignore
            [ELayerId.matterPort]: new CustomClusteringPainter(
              featurePainter,
            //  this.translateService,
              MatterPortClusterStyle,
            ),
          };
          poiLayer.painter = painterMap[this.layerInfo.id] ?? (this.layerInfo.painter || new PoiPainter());
          if (this.layerInfo.shapeProvider) poiLayer.shapeProvider = this.layerInfo.shapeProvider;
          if (poiLayer.painter instanceof CustomClusteringPainter) {
            poiLayer.transformer = createClusterTransformer();
          }
          (poiLayer as unknown as ClickableLayer).onMouseClick = (feature: Feature) => {
            if (typeof feature.properties["clusteredElements"] === 'undefined') this.subjectFeatureClicked.next(feature);
          };
          const existingLayer = map.layerTree.findLayerById(poiLayer.id);
          if (existingLayer && existingLayer instanceof FeatureLayer) {
            console.log(`Layer ${poiLayer.label} with id ${poiLayer.id} already exists`);
            resolve(existingLayer);
          } else {
            console.info(`Adding Layer: ${poiLayer.label} with id ${poiLayer.id}`);
            map.layerTree.addChild(poiLayer);
            resolve(poiLayer);
          }
        });
      }
    });
  }

  private moveLayerToTop(map: WebGLMap, layer: FeatureLayer) {
    if (map) {
      map.layerTree.moveChild(layer, 'top');
    }
  }

  public setFilter(map: WebGLMap, filter: (feature: Feature) => boolean) {
    this.currentFilter = filter;
    const layer = map?.layerTree.findLayerById(this.layerInfo.id) as FeatureLayer;
    if (layer) {
      this.mainMapService.makeSilentTrigger();
      // @ts-ignore
      layer.filter = this.currentFilter;
    }
  }

  public resetFilter(map: WebGLMap) {
    // @ts-ignore
    this.currentFilter = null;
    const layer = map?.layerTree.findLayerById(this.layerInfo.id) as FeatureLayer;
    // @ts-ignore
    if (layer) layer.filter = this.currentFilter;
  }

  public getLayerInfo() {
    return this.layerInfo;
  }
}
