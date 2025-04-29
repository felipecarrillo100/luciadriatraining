import { Component } from '@angular/core';
import {UILayerTypes} from "../../interfaces/UILayerTypes";
import {UICommand} from "../../services/interfaces/UICommand";
import {UICommandActions} from "../../interfaces/UICommandActions";
import {UICommandsService} from "../../services/uicommands.service";


// const defaultURL = "https://felipecarrillo100.github.io/mysite/week1/states.json";
const defaultURL = "./assets/data/osm_pois.json";

@Component({
  selector: 'app-connect-geojson',
  templateUrl: './connect-geojson.component.html',
  styleUrls: ['./connect-geojson.component.css']
})
export class ConnectGeojsonComponent {
  url = defaultURL;
  label = "GeoJSON Layer";
  autoZoom = true;

  constructor(private uiCommandsService: UICommandsService) {
  }
  submit(event: SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.addLayers();
  }

  private addLayers() {
    if (this.url.length>0) {
      const layerInfo = {
        layerType: UILayerTypes.GeoJSONLayer,
        model: {
          url: this.url,
        },
        layer: {
          editable: false,
          label: this.label,
          visible: true,
          selectable: true
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
