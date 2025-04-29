import { Component } from '@angular/core';
import {HxDRAuthService} from "../services/hx-drauth.service";
import {UICommandActions} from "../interfaces/UICommandActions";
import {UICommand} from "../services/interfaces/UICommand";
import {UICommandsService} from "../services/uicommands.service";
import {BingMapsMatch, BingmapsServices} from "../bingmaps/BingmapsServices";
import {MainMapService} from "../services/main-map.service";
import {createBounds} from "@luciad/ria/shape/ShapeFactory";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import {UILayerTypes} from "../interfaces/UILayerTypes";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  public searchLocation: string = "";
  activeSearch: boolean = false;
  matches: BingMapsMatch[] = []

  constructor(
    private authService: HxDRAuthService,
    private commandsService: UICommandsService,
    private mainMapService: MainMapService
  ) {
  }

  logout() {
    this.authService.logout()
  }

  openForm(formName: string) {
    const command: UICommand = {
      action: UICommandActions.ShowForm,
      parameters: {
        formName
      }
    };
    this.commandsService.submitCommand(command);
  }

  executeSearch() {
    if (this.activeSearch) {
      this.activeSearch = false;
      return;
    }
    BingmapsServices.searchWorld(this.searchLocation).then(matches=>{
      this.matches = matches;
      this.activeSearch = true;
    })
  }

  goToMatch(match: BingMapsMatch) {
    this.activeSearch = false;
    const map = this.mainMapService.getMap();
    if (map) {
      const reference = getReference("CRS:84");
      const bounds = createBounds(reference, [match.bbox[1], match.bbox[3]-match.bbox[1],match.bbox[0], match.bbox[2]-match.bbox[0],]);
      map.mapNavigator.fit({bounds, animate: true});
    }
  }

  createBingmap(name: "Aerial" | "Road" | "AerialWithLabels") {
    const command: UICommand = {
      action: UICommandActions.CreateAnyLayer,
      parameters: {
        layerType: UILayerTypes.BingmapsLayer,
        autoZoom: false,
        model: {
          imagerySet: name,
          useproxy: false,
          token: BingmapsServices.getToken()
        },
        layer:{
          label: name
        }
      }
    };
    console.log(JSON.stringify(command, null, 2))
    this.commandsService.submitCommand(command);
  }
}
