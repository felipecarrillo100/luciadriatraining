import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MapEffects} from "../configure-lightning-settings.service";

@Component({
  selector: 'app-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.css']
})
export class MoreComponent {
  @Input()
  // @ts-ignore
  public mapEffects: MapEffects;

  @Output()
  public changeSettings = new EventEmitter();

  applyChange(a: any) {
    this.changeSettings.emit();
  }

}
