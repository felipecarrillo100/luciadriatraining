import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {LuciadMapComponent} from './components/luciad-map/luciad-map.component';
import {SideBarComponent} from './components/side-bar/side-bar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LuciadMapComponent, SideBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,  // Make the component standalone
})
export class AppComponent {
  title = 'angular-luciad';
}
