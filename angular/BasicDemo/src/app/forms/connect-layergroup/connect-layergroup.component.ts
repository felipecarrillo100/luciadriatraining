import { Component } from '@angular/core';
import {UILayerTypes} from "../../interfaces/UILayerTypes";
import {UICommand} from "../../services/interfaces/UICommand";
import {UICommandActions} from "../../interfaces/UICommandActions";
import {UICommandsService} from "../../services/uicommands.service";

@Component({
  selector: 'app-connect-layergroup',
  templateUrl: './connect-layergroup.component.html',
  styleUrls: ['./connect-layergroup.component.css']
})
export class ConnectLayergroupComponent {
  protected label: string = "Group";

  constructor(private uiCommandsService: UICommandsService) {
  }

  submit($event: SubmitEvent) {
    this.addLayers();
  }

  private addLayers() {
    if (this.label.length>0) {
      const layerInfo = {
        layerType: UILayerTypes.LayerGroup,
        layer: {
          label: this.label,
          visible: true,
          id: "test"
        }
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
