import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WebGLMap} from '@luciad/ria/view/WebGLMap.js';

import {ModelFactory} from '../../../modules/luciad/factories/ModelFactory';
import {LayerFactory} from '../../../modules/luciad/factories/LayerFactory';



@Component({
  selector: 'app-luciad-map',
  imports: [],
  templateUrl: './luciad-map.component.html',
  styleUrl: './luciad-map.component.scss',
  standalone: true,  // Make the component standalone
})
export class LuciadMapComponent implements OnInit, OnDestroy {
  // IMPORTANT: The div component must be set to static:true
  @ViewChild('luciadMapContainer', { static: true }) mapContainer: ElementRef | null = null;

  private map: WebGLMap | null = null;

  // Initialize map
  ngOnInit(): void {
    if (this.mapContainer && this.mapContainer.nativeElement !== null) {
      this.map = new WebGLMap(this.mapContainer.nativeElement, {reference: "epsg:4978"});
      this.LoadLayers(this.map);
    } else {
      console.error(`Can't find the ElementRef reference for mapContainer)`);
    }
  }

  // Destroy map
  ngOnDestroy(): void {
    this.map?.destroy();
  }


  async LoadLayers(map: WebGLMap) {
    const modelWMS = await ModelFactory.createWMSModel({
      url: "https://sampleservices.luciad.com/wms",
      layers: [{layer: "4ceea49c-3e7c-4e2d-973d-c608fb2fb07e"}]
    })
    const layerWMS = await LayerFactory.createWMSLayer(modelWMS, {
      label: "WMS Layer",
    });

    const modelWFS = await ModelFactory.createWFSModel({
      url: "https://sampleservices.luciad.com/wfs",
      layer: "ns4:t_states__c__1213"
    })
    const layerWFS = await LayerFactory.createWFSLayer(modelWFS, {
      label: "WFS Layer",
    })

    const model3DTiles = await ModelFactory.createOgc3DTilesModel({
      url: "https://sampledata.luciad.com/data/ogc3dtiles/LucerneAirborneMesh/tileset.json"
    })
    const layer3DTiles = await LayerFactory.createOgc3DTilesLayer(model3DTiles, {
      label: "Mesh Layer",
    })

    map.layerTree.addChild(layerWMS);
    map.layerTree.addChild(layerWFS);
    map.layerTree.addChild(layer3DTiles);
    map.mapNavigator.fit({bounds: layer3DTiles.bounds, animate: true});
  }

}




