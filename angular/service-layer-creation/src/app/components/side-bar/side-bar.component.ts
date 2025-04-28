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
    "fitBounds": {
      "reference": "EPSG:4326",
      "coordinates": [
        -179.99999999999997,
        359.99999999999994,
        -89.99999999999999,
        179.99999999999997,
        0,
        0
      ]
    },
    "layerType": "WMSLayer",
    "model": {
      "getMapRoot": "https://sampleservices.luciad.com/wms",
      "layers": [
        "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e"
      ],
      "referenceText": "EPSG:3857",
      "transparent": true,
      "version": "1.3.0",
      "imageFormat": "image/png",
      "infoFormat": "text/html",
      "queryable": true
    },
    "layer": {
      "label": "Los Angeles Imagery",
      "visible": true,
      "queryable": true,
      "getFeatureInfoFormat": "application/json"
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
      "isDrapeTarget": true,
      "transparency": true,
      "idProperty": "FeatureID",
      "loadingStrategy": 1,
      "label": "/ogc/3dtiles/marseille-mesh",
      "visible": true,
      "offsetTerrain": true,
      "qualityFactor": 0.6,
      "isPointCloud": false
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
      "isDrapeTarget": true,
      "transparency": true,
      "idProperty": "FeatureID",
      "loadingStrategy": 1,
      "label": "/ogc/3dtiles/marseille-lidar",
      "visible": true,
      "offsetTerrain": true,
      "qualityFactor": 0.6,
      "isPointCloud": false
    },
    "autoZoom": true
  }
};
