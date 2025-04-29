import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MapEffects} from "../configure-lightning-settings.service";

@Component({
  selector: 'app-ambient-light',
  templateUrl: './ambient-light.component.html',
  styleUrls: ['./ambient-light.component.css']
})
export class AmbientLightComponent {
  @Input()
  // @ts-ignore
  public mapEffects: MapEffects;

  @Output()
  public changeSettings = new EventEmitter();
  constructor() {
  }
  applyChange(a: any) {
    this.changeSettings.emit();
  }


}
