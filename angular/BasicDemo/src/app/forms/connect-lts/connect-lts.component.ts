import { Component } from '@angular/core';
import {LTSCapabilities} from "@luciad/ria/model/capabilities/LTSCapabilities";
import {LTSCapabilitiesCoverage} from "@luciad/ria/model/capabilities/LTSCapabilitiesCoverage";
import {UILayerTypes} from "../../interfaces/UILayerTypes";
import {UICommand} from "../../services/interfaces/UICommand";
import {UICommandActions} from "../../interfaces/UICommandActions";
import {UICommandsService} from "../../services/uicommands.service";
import {BoundsObject} from "../utils/HcDRLayerInterfaces";


const defaultLTSURL = "https://sampleservices.luciad.com/lts";
@Component({
  selector: 'app-connect-lts',
  templateUrl: './connect-lts.component.html',
  styleUrls: ['./connect-lts.component.css']
})
export class ConnectLtsComponent {
  url = defaultLTSURL;
  label = "LTS Layer";
  id: string = "";
  layers: LTSCapabilitiesCoverage[] = [];
  autoZoom = true;

  constructor(private uiCommandsService: UICommandsService) {
  }

  submit(event: SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.addLayers();
  }

  private addLayers() {
    if (this.url.length>0 && this.id !== "") {
      const layer = this.layers.find(l=>l.id === this.id);

      if (layer) {
        const layerInfo = {
          layerType: UILayerTypes.LTSLayer,
          model: {
            coverageId: layer.id,
            referenceText: layer.referenceName,
            boundsObject: this.getLayerBounds(layer),
            level0Columns: layer.level0Columns,
            level0Rows: layer.level0Rows,
            tileWidth: layer.tileWidth,
            tileHeight: layer.tileHeight,
            dataType: layer.type,
            samplingMode: layer.samplingMode,
            url: this.url
          },
          layer: {
            label: this.label,
            visible: true,
          },
          autoZoom: this.autoZoom
        };
        const command: UICommand = {
          action: UICommandActions.CreateAnyLayer,
          parameters: layerInfo
        }
        console.log(JSON.stringify(command, null, 2));
        this.uiCommandsService.submitCommand(command);
      }
    }
  }

  private getLayerBounds = (layer: LTSCapabilitiesCoverage) =>{
    const e: BoundsObject = {
      coordinates:[], reference:""
    }
    const bounds = layer.getBounds();
    if (bounds && bounds.reference) {
      const r : BoundsObject = {
        coordinates: [bounds.x, bounds.width, bounds.y, bounds.height],
        reference: bounds.reference.identifier
      }
      return r;
    }
    return e;
  }


  getLayers() {
    const request = this.url;
    const options = {}
    LTSCapabilities.fromURL(request, options).then((result) => {
      if (result.coverages.length>0) {
        this.id = result.coverages[0].id;
        this.label = result.coverages[0].name;
        this.layers = result.coverages
      }
    })
  }

  setTargetLayers(event: any) {
    const foundLayer = this.layers.find(l=>l.id===this.id);
    this.label = foundLayer ? foundLayer.name : "";
  }
}
