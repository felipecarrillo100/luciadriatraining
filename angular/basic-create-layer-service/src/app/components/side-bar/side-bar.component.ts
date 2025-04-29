import {Component, inject} from '@angular/core';
import {MapLayerCommandsService} from '../../services/map-layer-commands.service';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent {
  private mapLayerCommandsService = inject(MapLayerCommandsService);

  addWMS() {
    this.mapLayerCommandsService.applyLayer(WMSCommand);
  }

  addMesh() {
    this.mapLayerCommandsService.applyLayer(MeshCommand);

  }

  addPointCloud() {
    this.mapLayerCommandsService.applyLayer(PoitCloudCommand);
  }
}

const WMSCommand = {
  "action": "CreateAnyLayer",
  "parameters": {
    "layerType": "WMSLayer",
    model: {
      url: "https://sampleservices.luciad.com/wms",
      layers: [{layer: "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e"}]
    },
    layer: {
      label: "WMS Layer",
    },
    "autoZoom": true
  }
}

const MeshCommand = {
  "action": "CreateAnyLayer",
  "parameters": {
    "layerType": "OGC3DTILES",
    "model": {
      "url": "https://sampleservices.luciad.com/ogc/3dtiles/marseille-mesh/tileset.json"
    },
    "layer": {
      "label": "Marseille-Mesh",
    },
    "autoZoom": true
  }
} ;

const PoitCloudCommand = {
  "action": "CreateAnyLayer",
  "parameters": {
    "layerType": "OGC3DTILES",
    "model": {
      "url": "https://sampleservices.luciad.com/ogc/3dtiles/marseille-lidar/tileset.json"
    },
    "layer": {
      "label": "Mrseille-Lidar",
    },
    "autoZoom": true
  }
};
