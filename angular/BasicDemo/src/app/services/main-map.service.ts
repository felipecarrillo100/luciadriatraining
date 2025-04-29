import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {WebGLMap} from "@luciad/ria/view/WebGLMap";
import {
  ContextMenuOnClosestSurfaceControllerEvent
} from "../luciad-map/controls/contextmenuonclosestsurface/ContextMenuOnClosestSurfaceController";
import {ContextMenu} from "@luciad/ria/view/ContextMenu";
import {Point} from "@luciad/ria/shape/Point";

@Injectable({
  providedIn: 'root'
})
export class MainMapService {
  private subjectMap = new BehaviorSubject<WebGLMap| null>(null);
  private subjectContextMenu = new BehaviorSubject<ContextMenu| null>(null);
  private subjectPointClick = new Subject<Point>;

  constructor() { }

  setMap(map: WebGLMap): void {
    this.initMap(map);
    this.subjectMap.next(map);
    this.testContextMenu(map)
  }
  onMapChange(): Observable<WebGLMap|null> {
    return this.subjectMap.asObservable();
  }

  onMapClick(): Observable<Point> {
    return this.subjectPointClick.asObservable();
  }

  getMap(): WebGLMap | null{
    return this.subjectMap.value;
  }

  setContextMenu(menu: ContextMenu | null): void {
    this.subjectContextMenu.next(menu);
  }

  getContextMenu(): ContextMenu | null {
    return this.subjectContextMenu.value;
  }

  getLayerById(id: string) {
    const map = this.getMap();
    if (map) {
      return map.layerTree.findLayerById(id)
    }
    return undefined;
  }

  private initMap(aMap: WebGLMap) {
    const map = aMap as any;
    map.onMouseClick = (point: Point) => {
       this.subjectPointClick.next(point);
    }
    map.contextMenuHandled = true;
    map.onCreateCustomContextMenu = ( event: ContextMenuOnClosestSurfaceControllerEvent) =>{
      map.contextMenuHandled = false;
      setTimeout(()=>{
        if (!map.contextMenuHandled) {
          const menu = this.getContextMenu();
          if (menu) {
            map.onShowContextMenu(event.position, menu)
          }
        }
      }, 30);
    }
  }

  private testContextMenu(map: WebGLMap) {
     const menu : ContextMenu = new ContextMenu();
     menu.addItem({label:"Feature Info", action: (a: any,b: any,c: any)=>{
       console.log('a',a);
         console.log('b',b);
         console.log('c',c);
       }} as any);
     this.setContextMenu(menu);
  }
}
