import {Component} from '@angular/core';

@Component({
  selector: 'app-connect-hxdr',
  templateUrl: './connect-hxdr.component.html',
  styleUrls: ['./connect-hxdr.component.css']
})
export class ConnectHxdrComponent {
  public currenttab: string = "main";

  setTab(tab: string) {
    this.currenttab = tab;
  }
}
