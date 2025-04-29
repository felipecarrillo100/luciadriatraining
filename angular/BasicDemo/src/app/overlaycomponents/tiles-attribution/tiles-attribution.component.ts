import {Component, Input} from '@angular/core';
import {WebGLMap} from "@luciad/ria/view/WebGLMap";
import {TileSetAttributionProvider} from "@luciad/ria/view/tileset/TileSetAttributionProvider";
import {Handle} from "@luciad/ria/util/Evented";

@Component({
  selector: 'app-tiles-attribution',
  templateUrl: './tiles-attribution.component.html',
  styleUrls: ['./tiles-attribution.component.css']
})
export class TilesAttributionComponent {
  private _map: WebGLMap | null = null;
  public logos: string[] = [];
  public strings: string[] = [];
  private handles: { attributionStringsListener: Handle; attributionLogosListener: Handle } | null = null;

  @Input()
  public staticAttributions = "";

  @Input()
  get map() {
    return this._map;
  }
  set map(value: WebGLMap | null) {
    if (this._map) {
      this.releaseListeners();
      this._map = null;
    } else {
      this._map = value;
      this.createListeners();
    }
  }

  private releaseListeners = () => {
    if (this.handles){
      for (const key in this.handles) {
        if (this.handles.hasOwnProperty(key)) {
          // @ts-ignore
          const handle = this.handles[key] as Handle;
          handle?.remove;
        }
      }
      this.handles = null;
    }
  }

  private createListeners() {
    if (this.map) {
      const attributionProvider = new TileSetAttributionProvider(this.map);

      const attributionLogosListener = attributionProvider.on("AttributionLogosChanged", () => {
        this.logos = attributionProvider.getAttributionLogos();
      });
      const attributionStringsListener = attributionProvider.on("AttributionStringsChanged", () => {
        this.strings = attributionProvider.getAttributionStrings();
      });

      this.handles = {
        attributionLogosListener,
        attributionStringsListener
      }
    }
  }

}
