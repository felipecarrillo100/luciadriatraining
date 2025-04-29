import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MapEffects} from "../configure-lightning-settings.service";

@Component({
  selector: 'app-sunlight',
  templateUrl: './sunlight.component.html',
  styleUrls: ['./sunlight.component.css']
})

export class SunlightComponent {

  @Input()
  // @ts-ignore
  public mapEffects: MapEffects;

  @Output()
  public changeSettings = new EventEmitter();


  public minTime: number = 0 ;
  public  maxTime: number = 0;


  ngOnInit() {
    this.minTime = this.mapEffects.lightning.time - 12 *60*60;
    this.maxTime = this.mapEffects.lightning.time + 12 *60*60;
  }


  applyChange(a: any) {
    this.changeSettings.emit();
  }

  formatTime(time: number) {
    const timestamp = time * 1000; // example timestamp
    const date = new Date(timestamp);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute:'numeric' } as any;
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
    return formattedDate
  }


}
