import {Component, Inject, inject} from '@angular/core';
import {MapLayerCommandsService} from '../../services/map-layer-commands.service';
import {
  BoundaryStoreService,
  DamagesStoreService,
  FeatureLayerStoreService, FilesStoreService
} from '../../services/feature-layer-store.service';
import {MainMapService} from '../../services/main-map.service';
import {Feature} from '@luciad/ria/model/feature/Feature.js';
import {create} from '@luciad/ria/view/feature/transformation/ClusteringTransformer.js';
import {createPoint} from '@luciad/ria/shape/ShapeFactory.js';
import {getReference} from '@luciad/ria/reference/ReferenceProvider.js';



@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent {
  private mapLayerCommandsService = inject(MapLayerCommandsService);
  private mainMapService = inject(MainMapService);

  constructor(
    @Inject(FilesStoreService) private readonly fileStoreService: FeatureLayerStoreService,
    ) {
  }


  addWMS() {
    this.mapLayerCommandsService.applyLayer(WMSCommand);
  }

  addMesh() {
    this.mapLayerCommandsService.applyLayer(MeshCommand);

  }

  addPointCloud() {
    this.mapLayerCommandsService.applyLayer(PoitCloudCommand);
  }

  addFiles() {
    const map = this.mainMapService.getMap();
    if (map) {
      this.fileStoreService.addFeatureLayerToMap(map).subscribe(()=>{
        const features = [] as Feature[];
        const crs84 = getReference("EPSG:4326");
        for (let i=0; i<10; ++i) {
          const shape = createPoint(crs84, [i,i,0]);
          const properties =  JSON.parse(JSON.stringify(DocumentProperties))
          const feature = new Feature(shape, properties, i);
          features.push(feature);
        }
        this.fileStoreService.putMultiple(features).subscribe();
      });
    }
    console.log(map)
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

const DocumentProperties = {
  "uuid": "f6f0fb4d-da3a-4317-9b79-57561708da2e",
  "id": 3003,
  "name": "Pruefbericht 2023",
  "asset": 1,
  "part": 513,
  "partName": "Südwestufer *",
  "size": "2,0 KB",
  "type": "PDF",
  "created_at": "2025-04-14T11:51:01.811882+00:00",
  "updated_at": "2025-04-14T11:51:01.811882+00:00",
  "children": [],
  "created_by": {
    "id": "ceaf7355-072a-4ec2-b94b-3400151686ec",
    "name": "Test",
    "surname": "User"
  },
  "assetId": 1,
  "pathname": "Helgoland.jpg",
  "location": {
    "type": "Polygon",
    "crs": {
      "type": "name",
      "properties": {
        "name": "EPSG:4326"
      }
    },
    "coordinates": [
      [
        [
          7.890359563148817,
          54.17824421228207,
          0.8
        ],
        [
          7.890359563148817,
          54.17824421228207,
          0.8
        ],
        [
          7.890359563148817,
          54.17824421228207,
          0.8
        ],
        [
          7.890359563148817,
          54.17824421228207,
          0.8
        ]
      ]
    ]
  },
  "meta_data": {},
  "expanded": false,
  "references": [],
  "layerId": null,
  "iconName": "file_general.png"
}

const DamageProperties = {
  "assetId": 1,
  "name": "",
  "description": "Fertigteil",
  "partName": "Fertigteil",
  "image": "https://www.dvz.de/fileadmin/_processed_/8/9/csm_Hafen-Hamburg_170905_Raetzke_HHLA_CTA_0735_v03_f020679453.jpg",
  "damageClass": 2,
  "id": 145,
  "asset": 1,
  "part": 503,
  "number": "2024-Mole-145-Mesh cracks",
  "material": {
    "id": 7,
    "name": "wsv_stahlbeton",
    "group": 1,
    "link_damage_group": [
      1,
      2,
      3,
      4,
      7,
      10,
      11,
      14
    ],
    "link_damage_class": "Massivbau",
    "created_at": "2025-04-14T11:51:01.523652+00:00",
    "updated_at": "2025-04-14T11:51:01.523652+00:00"
  },
  "type": {
    "id": 176,
    "name": "wsv_laengsriss_trocken",
    "group": {
      "id": 10,
      "name": "wsv_risse",
      "created_at": "2025-04-14T11:51:01.395732+00:00",
      "updated_at": "2025-04-14T11:51:01.395732+00:00"
    },
    "created_at": "2025-04-14T11:51:01.422224+00:00",
    "updated_at": "2025-04-14T11:51:01.422224+00:00",
    "link_material": null,
    "link_damage_class": null,
    "measurement_unit_1": 3,
    "measurement_unit_2": 2,
    "measurement_unit_3": null,
    "link_material_group": null,
    "estimation_remaining_cross_section": false
  },
  "created_at": "2025-04-14T11:51:02.153Z",
  "updated_at": "2025-04-14T11:51:02.153Z",
  "detail": {
    "id": 83,
    "asset": 1,
    "damage": 145,
    "inspection": {
      "id": 4,
      "asset": 1,
      "name": "Hauptprüfung 2023 Offsite",
      "remark": null,
      "completed_at": null,
      "issuer": "ceaf7355-072a-4ec2-b94b-3400151686ec",
      "created_at": "2023-06-21T00:12:30+00:00",
      "updated_at": "2025-04-14T11:51:02.135635+00:00"
    },
    "location": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            7.889442529,
            54.178885532,
            3.71634885
          ],
          [
            7.889461115,
            54.178881635,
            3.701011475
          ],
          [
            7.889461245,
            54.178881896,
            0.207068018
          ],
          [
            7.889443032,
            54.178885657,
            0.203054287
          ],
          [
            7.889442029,
            54.178885348,
            3.697890669
          ],
          [
            7.889442029,
            54.178885348,
            3.697890669
          ],
          [
            7.889442529,
            54.178885532,
            3.71634885
          ]
        ]
      ]
    },
    "status": 3,
    "class": 2,
    "size1": 1300,
    "size2": 3500,
    "size3": null,
    "estimation_remaining_cross_section": null,
    "quantity": null,
    "long_location": null,
    "cross_location": null,
    "height_location": null,
    "notice": null,
    "old_damage_type": null,
    "text": null,
    "created_at": "2025-04-14T11:51:02.177654+00:00",
    "updated_at": "2025-04-14T11:51:02.177654+00:00"
  }
}
