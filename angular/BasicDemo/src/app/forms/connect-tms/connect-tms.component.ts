import { Component } from '@angular/core';
import {UILayerTypes} from "../../interfaces/UILayerTypes";
import {UICommand} from "../../services/interfaces/UICommand";
import {UICommandActions} from "../../interfaces/UICommandActions";
import {UICommandsService} from "../../services/uicommands.service";

const defaultURL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{-y}.png";

@Component({
  selector: 'app-connect-tms',
  templateUrl: './connect-tms.component.html',
  styleUrls: ['./connect-tms.component.css']
})
export class ConnectTmsComponent {
  url = defaultURL;
  label = "TMS Layer";
  domains =  "a,b,c";
  levels =  22;
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
          layerType: UILayerTypes.TMSLayer,
          model: {
            baseURL: this.url,
            subdomains: this.domains.split(","),
            levelCount: this.levels
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
