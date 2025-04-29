import {Component, Inject} from '@angular/core';
import {MainMapService} from "../../services/main-map.service";
import {CreateFeatureInLayerController} from "../../luciad-map/controls/edit/CreateFeatureInLayerController";
import {ShapeType} from "@luciad/ria/shape/ShapeType";
import {AssetType, PortAssetStoreService} from "../../services/port-asset-store.service";

@Component({
  selector: 'app-connect-annotation',
  templateUrl: './connect-annotation.component.html',
  styleUrls: ['./connect-annotation.component.css']
})
export class ConnectAnnotationComponent {
  public assets: AssetType[] = [];

 constructor(
   private mainMapService: MainMapService,
   private portAssetStoreService: PortAssetStoreService,
 ) {

 }

  ngOnInit() {
    this.portAssetStoreService.getAll().subscribe((features)=>{
      this.assets = features.map(
        (feature)=>
          ({properties: feature.properties as any, id: feature.id as string, geometry: {} as any})
      );
    });
    this.portAssetStoreService.onContentChange().subscribe(change=>{
      switch (change.modelChangeType) {
        case "remove":
          this.deleteItem(change.id as string);
          break;
      }
    })
    const map = this.mainMapService.getMap();
    // Make sure the annotation layer is visible
    if (map) this.portAssetStoreService.addPortAssetsLayerToMap(map).subscribe();
  }

  addNew() {
    const map = this.mainMapService.getMap();
    if (map) this.portAssetStoreService.addPortAssetsLayerToMap(map).subscribe(layer=>{
      const asset: AssetType = {
        properties: {
          name:"name",
          description:"some text",
          image: "https://www.ge.com/digital/sites/default/files/2020-02/APM-Reliability-banner-1404x3200.jpg"
        },
        geometry: {}
      }
      if (map && layer ) {
        const controller = new CreateFeatureInLayerController(
          ShapeType.POLYGON,
          asset.properties,
          layer,
          map.controller,
          {
            callOnCompletion: (feature)=>{
              asset.id = feature.id as string;
              console.log(feature.id);
              this.assets.push(asset);
            }
          }
        )
        map.controller = controller;
      }
    })
  }

  deleteItem(id: string) {
    this.assets = this.assets.filter(item => item.id !== id);
  }
}
