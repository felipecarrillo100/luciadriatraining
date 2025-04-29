import { Component } from '@angular/core';
import {UICommandsService} from "../../services/uicommands.service";
import FileUtils from "../../luciad-map/utils/FileUtils";
import {UILayerTypes} from "../../interfaces/UILayerTypes";
import {UICommand} from "../../services/interfaces/UICommand";
import {UICommandActions} from "../../interfaces/UICommandActions";
import {TileLoadingStrategy} from "@luciad/ria/view/tileset/TileSet3DLayer";
import GetCapabilitiesFusionPanorama from "../utils/GetCapabilitiesFusionPanorama";

const defaultUrl = "https://sampledata.luciad.com/data/panoramics/LucernePegasus/cubemap_final.json";

@Component({
  selector: 'app-connect-panoramics',
  templateUrl: './connect-panoramics.component.html',
  styleUrls: ['./connect-panoramics.component.css']
})
export class ConnectPanoramicsComponent {
  public url: string = defaultUrl;
  public label: string = "";
  public iconHeightOffset: number = 2.5;
  private georeferenced: boolean = true;
  public autoZoom = true;
  public isDrapeTarget = true;
  private crs: string | undefined;

  constructor(private uiCommandsService: UICommandsService) {

  }

  getLayers = ()=> {
    GetCapabilitiesFusionPanorama.fromURL(this.url, {}).then(capabilities=>{
      this.label = FileUtils.parseUrl(this.url).path;
      this.georeferenced = capabilities.georeferenced;
      this.crs = capabilities.crs ? capabilities.crs.properties.name : undefined
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
        layerType: UILayerTypes.PanoramicLayer,
        model: {
          url: this.url.trim(),
          crs: this.crs
        },
        layer: {
          iconHeightOffset: this.iconHeightOffset,
          editable: false,
          selectable: false,
          label: this.label,
          visible: true,
        },
        autoZoom: this.autoZoom
      }
      const command: UICommand = {
        action: UICommandActions.CreateAnyLayer,
        parameters: layerInfo
      }
      console.log(command)
      this.uiCommandsService.submitCommand(command);
    }
  }

  urlHasChanged() {
    this.label = this.url;
  }

}
