import {Component, Inject} from '@angular/core';
import {MainMapService} from "../../services/main-map.service";
import {Feature} from "@luciad/ria/model/feature/Feature";
import {attachPanoControllerToMap} from "../../luciad-map/controls/panocontroller/actions/PanoAttach";
import {
  LabelAnnotationController,
  POINT_CREATION_EVENT
} from "../../luciad-map/controls/annotations/LabelAnnotationController";
import {Point} from "@luciad/ria/shape/Point";
import GeoTools from "../../luciad-map/utils/GeoTools";
import {CreateHxDRLayerFromProjectAssetCommand, LayerInfoHxDR} from "../utils/CreateHxDRLayerCommand";
import {Apollo} from "apollo-angular";
import {UICommandsService} from "../../services/uicommands.service";
import {LayerFactory} from "../../luciad-map/factories/LayerFactory";
import {UICommand} from "../../services/interfaces/UICommand";
import {DamagesStoreService, FeatureLayerStoreService} from "../../services/feature-layer-store.service";

export interface MyPOIType {
  id?: string;
  properties: {
    description: string;
    icon: string;
    image: string;
    name: string;
  }
  geometry: any;
}

@Component({
  selector: 'app-open-hx-drlayer-by-id',
  templateUrl: './open-hx-drlayer-by-id.component.html',
  styleUrls: ['./open-hx-drlayer-by-id.component.css']
})
export class OpenHxDRLayerByIdComponent {
  pois: MyPOIType[] = [];
  public currentId: string = "";
  public name: string = "";
  public description: string = "";
  public mode: "view" | "editing" = "view";
  public image: string = "";
  public icon = "";
  constructor(
    private apollo: Apollo,
    private mainMapService: MainMapService,
    @Inject(DamagesStoreService) private damagesStoreService: FeatureLayerStoreService,
    private uiCommandsService: UICommandsService
  ) {
    damagesStoreService.onShowFeature().subscribe(feature=>{
      console.log(feature);
    })
  }

  ngOnInit() {
    this.damagesStoreService.getAll().subscribe((features)=>{
      this.pois = features.map(
        (feature)=>
          ({properties: feature.properties as any, id: feature.id as string, geometry: {} as any})
      );
    });
    this.damagesStoreService.onContentChange().subscribe(change=>{
      switch (change.modelChangeType) {
        case "remove":
          this.deleteItem(change.id as string);
          break;
        case "add":
          this.addItem(change.feature);
          break;
      }
    })
    const map = this.mainMapService.getMap();
    // Make sure the annotation layer is visible
    if (map) this.damagesStoreService.addFeatureLayerToMap(map).subscribe();
  }

  addNew() {
    const map = this.mainMapService.getMap();
    if (!map) return;
    this.damagesStoreService.addFeatureLayerToMap(map).subscribe(layer => {
      const asset: any = {
        properties: {
          name: "POI",
          description: "some text",
          image: "https://www.dvz.de/fileadmin/_processed_/8/9/csm_Hafen-Hamburg_170905_Raetzke_HHLA_CTA_0735_v03_f020679453.jpg",
          icon: "https://cdn-icons-png.flaticon.com/128/1673/1673188.png"
        },
        geometry: {}
      }
      if (map && layer) {
        const controller = new LabelAnnotationController();
        controller.on(POINT_CREATION_EVENT, (point: Point) => {
          const point84 = GeoTools.reprojectPoint3D(point);
          const feature = new Feature(point84, asset.properties) as Feature;
          // @ts-ignore
          layer.model.store.add(feature as Feature);
          this.setDefaultController();
        })
        map.controller = controller;
      }
    })
  }

  setDefaultController() {
    const map = this.mainMapService.getMap();
    if (map) attachPanoControllerToMap(map);
  }

  deleteItem(id: string) {
    this.pois = this.pois.filter(item => item.id !== id);
  }

  addItem(item: Feature) {
    // @ts-ignore
    this.pois.push(item as MyPOIType);
  }

  editItem(poi: MyPOIType) {
    this.currentId = poi.id as string;
    this.name =  poi.properties.name;
    this.description =  poi.properties.description;
    this.image =  poi.properties.image;
    this.icon =  poi.properties.icon;
    this.mode = "editing";
  }

  showHxDRAsset(poi: MyPOIType) {
    const layerInfoHxDR: LayerInfoHxDR = {
      "id": "5b0443e0-a1d3-408b-9f53-135df2032e9a",
      "name": "smallwall",
      "type": "OGC_3D_TILES",
      "artifactId": "393f5c14-de34-4521-a3a8-d9e6b4f21e84",
      "endpoint": "/files/assets/45c5e889-db52-4f71-987c-167d2aeb82c9/artifacts/393f5c14-de34-4521-a3a8-d9e6b4f21e84/MESH/OGC3D_TILES/tileset.json?signature=NNEYrDgY_FvxhsIJKE2NFt5vc7xmFoo9pmvrwqAf9CR97YJl-fFbuOM27l48Rp52T7SiewTshsipnw4egFHhFFt4Yc6ueErT6YvclaR9yjYG4gsGm7N0E680Ar3ZezlX2RJtMTtFMUox6XN2CvaX5f43Jjfto0FNKOCdRq-JnNh9FHImK5xsJaPHbLrc7azu0shIiXeOarye5YVEANTOB21cTVwJGe_yzwRLwHg5nTZyXjl3ELEqmLf8b2kzODjt3QqWt7KQ_nYFB1XZT_BLSvvS_9u6b-rhJEE_bLP5nMpzoYZrYe3KaLc7vzPs1YEzrFS_wQ8l5qdQIdtU3zYhsg1dPjBIY5vFXtYmdwB6OndRFMvb-PIDlJbvSH6ivGfOVE_iWRXuX4Va6xT17c5z0z-LNHANC4WoAmYNkd9-edv5LMN2ITjYwoWobElLTYkbMEpB8Wb5khJB4PnnUdzRS8D8QAqCSKEOz7a_OYyV8saiP5R4XeyovBQ6dGsLExpp2UxCA6lQ56pkToIkAnVn4m2TskiXGJjY8ynsnbdiNs8igKDJ2_nqb6aRwZJmPE-q2uzKLRP8nXnVWhb7kgEialIs2lB2lvQOkM08FGlWDTBFYKvASwvRWizdYh3I_gd-hRPSUfaF4529KlKdLszrbYAMVf5pm26dxOVSiyjeEjStLADMNpBcUqQZOkipQzR7xRcTETnXTyx6Ons-p9WfwA==",
      "addressId": "e9e97401-ab98-411b-a569-d99732bb31b3"
    }
    const map = this.mainMapService.getMap();
    if (!map) return;
    const layer = map.layerTree.findLayerById(layerInfoHxDR.id);
    if (layer) {
      //  This code zoom to the layer
      LayerFactory.getLayerBounds(layer).then(bounds=>{
        map.mapNavigator.fit({bounds, animate: true});
      });
    } else {
      CreateHxDRLayerFromProjectAssetCommand(this.apollo, layerInfoHxDR).then(command=>{
        if (command) {
          command.parameters.autoZoom = true;
          if (layerInfoHxDR.type==="HSPC" || layerInfoHxDR.type==="OGC_3D_TILES") {
            command.parameters.layer.offsetTerrain = true;
          }
          if (layerInfoHxDR.type==="OGC_3D_TILES") {
            command.parameters.layer.isDrapeTarget = true;
          }
          command.parameters.layer.id = layerInfoHxDR.id;
          this.uiCommandsService.submitCommand(command as UICommand);
        } else {
          console.log(`Was not able to create command: ${layerInfoHxDR.name} ${layerInfoHxDR.type}`);
        }
      })
    }
  }

  editStop() {
    this.mode = "view";
  }
  submitNew() {
    this.editStop();
    this.damagesStoreService.get(this.currentId).subscribe(feature=>{
      if ( feature  ) {
        const properties = {
          name: this.name,
          description: this.description,
          image: this.image,
          icon:this.icon,
        }
        feature.properties = properties;
        this.damagesStoreService.put(feature).subscribe(id=>{
          console.log(id);
        });
      }
    })

  }

}
