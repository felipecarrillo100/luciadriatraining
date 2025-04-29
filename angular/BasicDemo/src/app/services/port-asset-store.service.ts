import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {WebGLMap} from "@luciad/ria/view/WebGLMap";
import {MyJSONOnlineStore} from "../luciad-map/stores/MyJSONOnlineStore";
import {ModelFactory} from "../luciad-map/factories/ModelFactory";
import {FeatureModel} from "@luciad/ria/model/feature/FeatureModel";
import {Feature} from "@luciad/ria/model/feature/Feature";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {LayerFactory} from "../luciad-map/factories/LayerFactory";
import {ContextMenu} from "@luciad/ria/view/ContextMenu";
import {Map} from "@luciad/ria/view/Map";
import {EditSelectLayerTools} from "../luciad-map/controls/edit/EditSelectLayerTools";
import {PortAssetsPainter} from "../luciad-map/painters/PortAssetsPainter";
import {Controller} from "@luciad/ria/view/controller/Controller";

interface ModelChangedObject {
  modelChangeType: "add" | "update" | "remove";
  feature: Feature;
  id: number | string;
}

export interface AssetType {
  id?: string;
  properties: {
    name: string;
    description: string;
    image: string;
  }
  geometry: any;
}
@Injectable({
  providedIn: 'root'
})
export class PortAssetStoreService {
  private subjectModel = new BehaviorSubject<FeatureModel| null>(null);
  private subjectContentChange = new Subject<ModelChangedObject>;

  constructor() {
    ModelFactory.createMyJSONOnlineFeatureModel({collection: "409c809f-9405-479d-8c4b-1d00fcc8c892"}).then(model=>{
      model.on("ModelChanged",   (modelChangeType: "add" | "update" | "remove", feature: Feature, id: number | string)=>{
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

  getModel(): FeatureModel | null{
    return this.subjectModel.value;
  }

  onModelChange(): Observable<FeatureModel|null> {
    return this.subjectModel.asObservable();
  }

  onContentChange(): Observable<ModelChangedObject> {
    return this.subjectContentChange.asObservable();
  }

  onModelReady(): Observable<FeatureModel> {
    return new Observable<FeatureModel>(subscriber => {
      if (this.subjectModel.value) {
        subscriber.next(this.subjectModel.value);
      } else {
        this.onModelChange().subscribe((m)=>{
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
        const store = model.store as MyJSONOnlineStore;
        store.query().then(cursor=>{
          const features: Feature[] = [];
          while (cursor.hasNext()) {
            const feature= cursor.next();
            features.push(feature);
          }
          subscriber.next(features);
        })
      }
    })
  }

  get(id: string): Observable<Feature> {
    return new Observable<Feature>(subscriber => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(undefined);
      } else {
        const store = model.store as MyJSONOnlineStore;
        store.get(id).then(feature=>{
          subscriber.next(feature);
        })
      }
    })
  }

  delete(id: string): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(false);
      } else {
        const store = model.store as MyJSONOnlineStore;
        store.remove(id).then(value=>{
          subscriber.next(value);
        })
      }
    })
  }

  put(feature: Feature): Observable<string> {
    return new Observable<string>(subscriber => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(undefined);
      } else {
        const store = model.store as MyJSONOnlineStore;
        store.put(feature).then(value=>{
          subscriber.next(value);
        })
      }
    })
  }

  add(feature: Feature): Observable<string> {
    return new Observable<string>(subscriber => {
      const model = this.getModel();
      if (!model) {
        subscriber.next(undefined);
      } else {
        const store = model.store as MyJSONOnlineStore;
        store.add(feature).then(value=>{
          subscriber.next(value);
        })
      }
    })
  }

  public addPortAssetsLayerToMap(map: WebGLMap): Observable<FeatureLayer> {
    return new Observable<FeatureLayer>(subscriber => {
      if (!map) subscriber.next(undefined);
      this.onModelReady().subscribe(model=>{
        if (!model) {
          subscriber.next(undefined);
        } else {
          const layer =  map.layerTree.findLayerById("layer-assets") as FeatureLayer;
          if (layer) {
            this.moveLayerToTop(map, layer);
            subscriber.next(layer);
          } else {
            this.createNewLayerInMap(map).then(newLayer=>subscriber.next(newLayer));
          }
        }
      })
    })
  }

  private createNewLayerInMap(map: WebGLMap) {
    return new Promise<FeatureLayer>(resolve=>{
      const model = this.getModel();
      if (model) {
        const portAssetsLayerPromise =  LayerFactory.createEditableFeatureLayer( model,
          {
            label: "Assets",
            id: "layer-assets",
            selectable: true,
            editable: true
          });
        portAssetsLayerPromise.then(portAssetsLayer=>{
          portAssetsLayer.painter = new PortAssetsPainter();
          portAssetsLayer.onCreateContextMenu = (contextMenu: ContextMenu, map: Map, contextMenuInfo: any) => {
            const fallbackController = map.controller as Controller;
            contextMenu.addItem({label:"Edit shape", action: ()=>{
                EditSelectLayerTools.editFeature(portAssetsLayer, map, contextMenuInfo, fallbackController);
              }});
            contextMenu.addItem({label:"Delete", action: ()=>{
                EditSelectLayerTools.deleteFeature(portAssetsLayer, map, contextMenuInfo );
              }});
          };
          map.layerTree.addChild(portAssetsLayer);
          resolve(portAssetsLayer);
        })
      }
    })

  }

  private moveLayerToTop(map: WebGLMap, layer: FeatureLayer) {
    if (map) {
      map.layerTree.moveChild(layer, "top");
    }
  }
}
