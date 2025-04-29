import {Component, Input} from '@angular/core';
import {MainMapService} from "../../../services/main-map.service";
import {ShapeType} from "@luciad/ria/shape/ShapeType";
import {CreateFeatureInLayerController} from "../../../luciad-map/controls/edit/CreateFeatureInLayerController";
import {FeatureModel} from "@luciad/ria/model/feature/FeatureModel";
import {Feature} from "@luciad/ria/model/feature/Feature";
import {EditController} from "@luciad/ria/view/controller/EditController";
import {PortAssetStoreService} from "../../../services/port-asset-store.service";
import {CustomEditController} from "../../../luciad-map/controls/edit/custom/CustomEditController";

const fitMargin = "25px";

@Component({
  selector: 'app-port-asset',
  templateUrl: './port-asset.component.html',
  styleUrls: ['./port-asset.component.css']
})
export class PortAssetComponent {

  @Input()
  // @ts-ignore
  public asset: AssetType;

  public editing = false;
  public name: string = "";
  public description: string = "";
  public image: string = "";

  constructor(private mainMapService: MainMapService,
              private portAssetStoreService: PortAssetStoreService
  ) {
  }
  setGeometry = (newFeature: Feature) =>{
    this.portAssetStoreService.get(this.asset.id).subscribe(feature=>{
      if ( feature &&  newFeature && newFeature.shape ) {
        feature.shape = newFeature.shape
        this.portAssetStoreService.put(feature).subscribe(id=>{
          console.log(id);
        });
      }
    })
  }
  replaceShape() {
    const map = this.mainMapService.getMap();
    if (map) this.portAssetStoreService.addPortAssetsLayerToMap(map).subscribe(layer=>{
        const controller = new CreateFeatureInLayerController(
          ShapeType.POLYGON,
          this.asset.properties,
          layer,
          map.controller,
          {
            createFeature: false,
            callOnCompletion: this.setGeometry
          }
        )
        map.controller = controller;
    });
  }

  delete() {
    this.portAssetStoreService.delete(this.asset.id).subscribe(success=>{
      if(success) console.log("Item deleted:" +this.asset.id)
    });
  }

  locate() {
    const map = this.mainMapService.getMap();
    if (map) this.portAssetStoreService.addPortAssetsLayerToMap(map).subscribe(layer=>{
      this.portAssetStoreService.get(this.asset.id).subscribe(feature=>{
        if (map && feature && feature.shape ) {
          const bounds = feature.shape.bounds;
          if (bounds) map.mapNavigator.fit({bounds, animate: true, fitMargin});
        }
      });
    });
  }

  editMode(b: boolean) {
    this.editing = b;
    if (b) {
      this.name = this.asset.properties.name ;
      this.description = this.asset.properties.description;
      this.image = this.asset.properties.image;
    }
  }


  editOK(b: boolean) {
    this.editMode(false);

    const newAsset = {...this.asset}
    newAsset.properties.name = this.name;
    newAsset.properties.description = this.description;
    newAsset.properties.image = this.image;

    this.portAssetStoreService.get(this.asset.id).subscribe(feature=>{
      if ( feature  ) {
        feature.properties = newAsset.properties;
        this.portAssetStoreService.put(feature).subscribe(id=>{
          console.log(id);
        });
      }
    })
  }

  editShape() {
    const map = this.mainMapService.getMap();
    if (map) this.portAssetStoreService.addPortAssetsLayerToMap(map).subscribe(layer=>{
      const model = layer.model as FeatureModel;
      if (map && layer) {
        const fallbackController = map.controller;
        this.portAssetStoreService.get(this.asset.id).subscribe(feature=>{
          if (feature.shape) {
            const bounds = feature.shape.bounds;
            if (bounds) map.mapNavigator.fit({bounds, animate: false, fitMargin}).then(()=>{
              const editController = new CustomEditController(layer, feature,{finishOnSingleClick: true});

              editController.onDeactivate = (...args) => {
                const promise =  new Promise<void>( resolve => {
                  EditController.prototype.onDeactivate.apply(editController, args);
                  map.controller =  fallbackController;
                  resolve();
                } );
                return promise;
              };
              map.controller = editController;
            });
          }
        });
      }
    })
  }
}
