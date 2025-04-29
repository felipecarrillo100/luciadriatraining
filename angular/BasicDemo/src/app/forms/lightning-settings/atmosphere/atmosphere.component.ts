import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MapEffects} from "../configure-lightning-settings.service";

@Component({
  selector: 'app-atmosphere',
  templateUrl: './atmosphere.component.html',
  styleUrls: ['./atmosphere.component.css']
})
export class AtmosphereComponent {
  @Input()
  // @ts-ignore
  public mapEffects: MapEffects;

  @Output()
  public changeSettings = new EventEmitter();

  applyChange(a: any) {
    this.changeSettings.emit();
  }

  protected readonly Number = Number;
}
