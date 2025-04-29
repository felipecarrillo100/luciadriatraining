import {Component} from '@angular/core';
import {AuthState, HxDRAuthService} from "./services/hx-drauth.service";
import {ConnectWMSFormComponent} from "./forms/connect-wmsform/connect-wmsform.component";
import {ConnectHxdrComponent} from "./forms/connect-hxdr/connect-hxdr.component";
import {ConnectTmsComponent} from "./forms/connect-tms/connect-tms.component";
import {ConnectLtsComponent} from "./forms/connect-lts/connect-lts.component";
import {ConnectAnnotationComponent} from "./forms/connect-annotation/connect-annotation.component";
import {ConnectWfsComponent} from "./forms/connect-wfs/connect-wfs.component";
import {ConnectTiles3dComponent} from "./forms/connect-tiles3d/connect-tiles3d.component";
import {ConnectHspcComponent} from "./forms/connect-hspc/connect-hspc.component";
import {ConnectPanoramicsComponent} from "./forms/connect-panoramics/connect-panoramics.component";
import {OpenHxDRLayerByIdComponent} from "./forms/open-hx-drlayer-by-id/open-hx-drlayer-by-id.component";
import {ConnectLayergroupComponent} from "./forms/connect-layergroup/connect-layergroup.component";
import {ConnectGeojsonComponent} from "./forms/connect-geojson/connect-geojson.component";
import {LightningSettingsComponent} from "./forms/lightning-settings/lightning-settings.component";
import {ReferenceLoaderService} from "./services/reference-loader.service";
import {ConnectCustomPanoramicsComponent} from "./forms/connect-custom-panoramics/connect-custom-panoramics.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-luciaria';
  authenticated = AuthState.Loading;

  constructor(
    private authService: HxDRAuthService,
    private referenceLoaderService: ReferenceLoaderService,
  ) {
  }

  public authenticate() {
    this.authService.redirectToCognito();
  }

  ngOnInit() {
    this.authService.getToken().then(()=>{
      this.referenceLoaderService.onReferencesLoaded().subscribe((success)=>{
        console.log("References Loaded: " + success)
        this.authenticated = AuthState.Authenticated;
      })
    }, ()=>{
      this.authenticated = AuthState.NotAuthenticated;
    });
  }

  protected readonly AuthState = AuthState;
  public formProvider(formName: string) {

    switch (formName) {
      case "ConnectLayergroupComponent":
        return ConnectLayergroupComponent;
      case "ConnectWMSFormComponent":
        return ConnectWMSFormComponent;
      case "ConnectHxdrComponent":
        return ConnectHxdrComponent;
      case "ConnectTmsComponent":
        return ConnectTmsComponent;
      case "ConnectLtsComponent":
        return ConnectLtsComponent;
      case "LightningSettingsComponent":
        return LightningSettingsComponent;
      case "ConnectAnnotationComponent":
        return ConnectAnnotationComponent;
      case "OpenHxDRLayerByIdComponent":
        return OpenHxDRLayerByIdComponent;
      case "ConnectWfsComponent":
        return ConnectWfsComponent;
      case "ConnectTiles3dComponent":
        return ConnectTiles3dComponent;
      case "ConnectHspcComponent":
        return ConnectHspcComponent;
      case "ConnectPanoramicsComponent":
        return ConnectPanoramicsComponent;
      case "ConnectCustomPanoramicsComponent":
        return ConnectCustomPanoramicsComponent;
      case "ConnectGeojsonComponent":
        return ConnectGeojsonComponent;
      default:
        return null;
    }
  }
}
