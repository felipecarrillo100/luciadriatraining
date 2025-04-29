import { Component } from '@angular/core';
import {UICommandsService} from "../../services/uicommands.service";
import FileUtils from "../../luciad-map/utils/FileUtils";
import {UILayerTypes} from "../../interfaces/UILayerTypes";
import {UICommand} from "../../services/interfaces/UICommand";
import {UICommandActions} from "../../interfaces/UICommandActions";
import {TileLoadingStrategy} from "@luciad/ria/view/tileset/TileSet3DLayer";
import GetCapabilitiesHSPC from "../utils/GetCapabilitiesHSPC";


const DefaultLoadingStrategy = TileLoadingStrategy.OVERVIEW_FIRST;
const defaultUrl = "https://trident-lf.luciad.com/hspc/v12/limerick/tree.hspc";

@Component({
  selector: 'app-connect-hspc',
  templateUrl: './connect-hspc.component.html',
  styleUrls: ['./connect-hspc.component.css']
})

export class ConnectHspcComponent {
  public url: string = defaultUrl;
  public label: string = "";
  private features: string = "";
  public qualityFactor: number = 0.3;
  private isPointCloud = false;
  private georeferenced: boolean = true;
  public autoZoom = true;
  public offsetTerrain: boolean= true;
  public isDrapeTarget = true;


  constructor(private uiCommandsService: UICommandsService) {

  }

  getLayers = ()=> {
    GetCapabilitiesHSPC.fromURL(this.url, {}).then(capabilities=>{
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
        layerType: UILayerTypes.HSPCLayer,
        model: {
          url: this.url.trim(),
          featuresUrl: this.features.length > 0 ? this.features : undefined,
        },
        layer: {
          isDrapeTarget: false,
          transparency: false,
          selectable: false,
          idProperty: "FeatureID",
          loadingStrategy: DefaultLoadingStrategy,
          label: this.label,
          visible: true,
          offsetTerrain: this.offsetTerrain,
          qualityFactor: this.qualityFactor,
          isPointCloud: this.isPointCloud,
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
