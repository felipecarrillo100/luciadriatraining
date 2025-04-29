import { Component } from '@angular/core';
import {UICommandsService} from "../../services/uicommands.service";
import {WFSCapabilities} from "@luciad/ria/model/capabilities/WFSCapabilities";
import {WFSCapabilitiesFeatureType} from "@luciad/ria/model/capabilities/WFSCapabilitiesFeatureType";
import {WMSCapabilitiesUtils} from "../utils/WMSCapabilitiesUtils";
import {UILayerTypes} from "../../interfaces/UILayerTypes";
import {UICommand} from "../../services/interfaces/UICommand";
import {UICommandActions} from "../../interfaces/UICommandActions";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import {WFSCapabilitiesUtils} from "../utils/WFSCapabilitiesUtils";


@Component({
  selector: 'app-connect-wfs',
  templateUrl: './connect-wfs.component.html',
  styleUrls: ['./connect-wfs.component.css']
})
export class ConnectWfsComponent {
  public url = "https://sampleservices.luciad.com/wfs";
  public label = "WFS layer";
  public name = "";
  public referenceText = "";
  public format = "application/json";
  public formats: string[] = [] ;
  public version: string = "";
  public featureTypes: WFSCapabilitiesFeatureType[] = [];
  public autoZoom = true;

  constructor(private uiCommandsService: UICommandsService) {
  }
  public getLayers() {
    const request = this.url;
    const options = {}
    WFSCapabilities.fromURL(request, options).then((result) => {
        let projections: string[] = [];
        const currentfeatureType = result.featureTypes[0];
        this.featureTypes = result.featureTypes;
        this.label = currentfeatureType.title;
        this.name = currentfeatureType.name;
        this.referenceText = currentfeatureType.defaultReference;
        this.format = WFSCapabilitiesUtils.getPreferredFormat(currentfeatureType.outputFormats);
        this.formats = currentfeatureType.outputFormats;
        this.version = result.version;
    })
  }

  submit(event: SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.addLayers();
  }

  setCurrentLayer(event: any) {
    const currentFeatureType = this.featureTypes.find(l=>l.name===this.name);
    if (currentFeatureType) {
      this.label = currentFeatureType.title;
      this.referenceText = currentFeatureType.defaultReference;
      this.format = WFSCapabilitiesUtils.getPreferredFormat(currentFeatureType.outputFormats);
      this.formats = currentFeatureType.outputFormats;
    }
  }

  private addLayers() {
    const currentFeatureType = this.featureTypes.find(l=>l.name===this.name);
    if (this.name.trim()!=="" && this.url.trim() !== "" && currentFeatureType) {
      const fitBounds = WFSCapabilitiesUtils.simplifyBounds(currentFeatureType);
      const layerInfo = {
          layerType: UILayerTypes.WFSLayer,
          fitBounds,
          model: {
            generateIDs: false,
            outputFormat: this.format,
            swapAxes: false,
            swapQueryAxes: false,
            serviceURL: this.url.trim(),
            postServiceURL: this.url.trim(),
            referenceText: this.referenceText,
            typeName: this.name,
            versions: [this.version],
            methods: ["POST"],
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
        this.uiCommandsService.submitCommand(command);
    }
  }
}
