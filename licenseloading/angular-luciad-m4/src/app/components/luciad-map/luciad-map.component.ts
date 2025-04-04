import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WebGLMap} from '@luciad/ria/view/WebGLMap.js';

@Component({
  selector: 'app-luciad-map',
  imports: [],
  templateUrl: './luciad-map.component.html',
  styleUrl: './luciad-map.component.scss'
})
export class LuciadMapComponent implements OnInit, OnDestroy {
  // The div component must be set to static=true
  @ViewChild('luciadMapContainer', { static: true }) mapContainer: ElementRef | null = null;

  private map: WebGLMap | null = null;

  ngOnInit(): void {
    if (this.mapContainer && this.mapContainer.nativeElement !== null) {
      this.map = new WebGLMap(this.mapContainer.nativeElement, {reference: "epsg:4978"});
    } else {
      console.error(`Can't find the ElementRef reference for mapContainer)`);
    }
  }

  ngOnDestroy(): void {
    this.map?.destroy();
  }

}
