import { Component } from '@angular/core';
import {WMSCapabilitiesLayer} from "@luciad/ria/model/capabilities/WMSCapabilitiesLayer";
import {WMSCapabilities} from "@luciad/ria/model/capabilities/WMSCapabilities";
import {UICommandsService} from "../../services/uicommands.service";
import {UICommand} from "../../services/interfaces/UICommand";
import {UICommandActions} from "../../interfaces/UICommandActions";
import {UILayerTypes} from "../../interfaces/UILayerTypes";
import {WMSCapabilitiesUtils} from "../utils/WMSCapabilitiesUtils";

@Component({
  selector: 'app-connect-wmsform',
  templateUrl: './connect-wmsform.component.html',
  styleUrls: ['./connect-wmsform.component.css']
})
export class ConnectWMSFormComponent {

  public url = "https://via.bund.de/wsv/bwastr/wms";
  public label = "";
  public format = "";
  public projection = "";
  public autoZoom = true;

  public layers = [] as WMSCapabilitiesLayer[];
  public formats = [] as string[];
  public projections = [] as string[];
  public version = "";
  public targetLayers = [] as string[];

  constructor(private uiCommandsService: UICommandsService) {
  }
  setTargetLayers( e: any) {
    const selectedLayers = this.targetLayers.map(v=>{
      const foundLayer = this.layers.find(l=>l.name===v);
      return foundLayer ? foundLayer.title : ""
    });
    this.label = selectedLayers.join(",");
  }

  submit(event: SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.addLayers();
  }

  public getLayers() {
    const request = this.url;
    const options = {}
    WMSCapabilities.fromURL(request, options).then((result) => {
      let projections: string[] = [];
      const flatLayers = WMSCapabilitiesUtils.flattenWmsLayerHierarchy(result.layers);
      if (flatLayers.length>0) {

          const getMap = WMSCapabilitiesUtils.GetMap(result.operations);
          // const getMapFeatureInfo = GetFeatureInfo(result.operations);
          if (getMap) {
            this.format = WMSCapabilitiesUtils.getPreferredFormat(getMap.supportedFormats);
            this.formats = getMap.supportedFormats;
          }
          this.label = flatLayers[0].title;
          this.targetLayers = [ flatLayers[0].name ];
          this.projection = WMSCapabilitiesUtils.getPreferredProjection(flatLayers[0].supportedReferences);
          projections = flatLayers[0].supportedReferences;
      }

      this.projections = projections;
      this.layers = flatLayers;

      this.version = result.version;
    })
  }

  private addLayers() {
    if (this.targetLayers.length>0) {
      const layer = this.layers.find(l=>l.name === this.targetLayers[0]);
      const selectedLayers = this.layers.filter((l)=> this.targetLayers.findIndex(ll=>ll===l.name) > -1);
      const unionBounds = WMSCapabilitiesUtils.simplifyBounds(selectedLayers, this.projection);
      if (layer) {
        const layerInfo = {
          fitBounds: unionBounds,
          layerType: UILayerTypes.WMSLayer,
          model: {
            getMapRoot: this.url,
            layers: this.targetLayers,
            referenceText: this.projection,
            transparent: true,
            version: this.version,
            imageFormat: this.format,
            infoFormat: "text/html",   // "application/json",
            queryable: true,
          },
          layer: {
            label: this.label,
            visible: true,
            queryable: true,
            getFeatureInfoFormat: "application/json",
          },
          autoZoom: this.autoZoom
        };
        const command: UICommand = {
          action: UICommandActions.CreateAnyLayer,
          parameters: layerInfo
        }
      //  console.log(JSON.stringify(command, null, 2));
        this.uiCommandsService.submitCommand(command);
      }
    }
  }
}
