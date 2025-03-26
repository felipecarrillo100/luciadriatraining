import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {LuciadMapComponent} from './components/luciad-map/luciad-map.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LuciadMapComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular-luciad';
}
