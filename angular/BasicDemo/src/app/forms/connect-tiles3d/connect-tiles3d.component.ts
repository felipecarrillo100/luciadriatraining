import { Component } from '@angular/core';
import {UICommandsService} from "../../services/uicommands.service";
import GetCapabilities3DTiles from "../utils/GetCapabilities3DTiles";
import {UICommand} from "../../services/interfaces/UICommand";
import {UICommandActions} from "../../interfaces/UICommandActions";
import {UILayerTypes} from "../../interfaces/UILayerTypes";
import {TileLoadingStrategy} from "@luciad/ria/view/tileset/TileSet3DLayer";
import FileUtils from "../../luciad-map/utils/FileUtils";

const DefaultLoadingStrategy = TileLoadingStrategy.OVERVIEW_FIRST;
const defaultUrl = "https://sampleservices.luciad.com/ogc/3dtiles/marseille-mesh/tileset.json"
@Component({
  selector: 'app-connect-tiles3d',
  templateUrl: './connect-tiles3d.component.html',
  styleUrls: ['./connect-tiles3d.component.css']
})
export class ConnectTiles3dComponent {
  public url: string = defaultUrl;
  public label: string = "";
  private features: string = "";
  public qualityFactor: number = 0.6;
  private isPointCloud = false;
  private georeferenced: boolean = true;
  public autoZoom = true;
  public offsetTerrain: boolean= true;
  public isDrapeTarget = true;
  public verticalOffset = 0;

  constructor(private uiCommandsService: UICommandsService) {

  }

  getLayers = ()=> {
    GetCapabilities3DTiles.fromURL(this.url, {}).then(capabilities=>{
      this.label = FileUtils.parseUrl(this.url).path;
      this.georeferenced = capabilities.georeferenced;
    })
  }
  submit(event: SubmitEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.addLayer();
  }

  private addLayer() {
    if (!this.georeferenced) {
      console.log("Model not georeferenced");
      return
    }
    if (this.url.trim().length>0 && this.label.trim().length>0){
      const layerInfo =  {
        layerType: UILayerTypes.OGC3DTILES,
        model: {
          url: this.url.trim(),
          featuresUrl: this.features.length > 0 ? this.features : undefined,
        },
        layer: {
          isDrapeTarget: this.isDrapeTarget,
          transparency: true,
          idProperty: "FeatureID",
          loadingStrategy: DefaultLoadingStrategy,
          label: this.label,
          visible: true,
          offsetTerrain: this.offsetTerrain,
          qualityFactor: this.qualityFactor,
          isPointCloud: this.isPointCloud,
          offsetTransformation: this.verticalOffset !== 0 ? {z: this.verticalOffset} : undefined
        },
        autoZoom: this.autoZoom
      }
      const command: UICommand = {
        action: UICommandActions.CreateAnyLayer,
        parameters: layerInfo
      }
      this.uiCommandsService.submitCommand(command);
    }
  }

  urlHasChanged() {
    this.label = this.url;
  }
}
