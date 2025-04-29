import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import {LuciadMapComponent} from "./luciad-map/luciad-map.component";
import { LayerControlComponent } from './layer-control/layer-control.component';
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {fas} from "@fortawesome/free-solid-svg-icons";
import {far} from "@fortawesome/free-regular-svg-icons";
import { LayerControlNodeComponent } from './layer-control/layer-control-node/layer-control-node.component';
import { ConnectWMSFormComponent } from './forms/connect-wmsform/connect-wmsform.component';
import {FormsModule} from "@angular/forms";
import { GraphQLModule } from './graphql/graphql.module';
import { HttpClientModule } from '@angular/common/http';
import { ConnectHxdrComponent } from './forms/connect-hxdr/connect-hxdr.component';
import { HxdrProjectFolderComponent } from './forms/connect-hxdr/hxdr-projects/hxdr-project-folder/hxdr-project-folder.component';
import { HxdrProjectAssetComponent } from './forms/connect-hxdr/hxdr-projects/hxdr-project-asset/hxdr-project-asset.component';
import { HxdrProjectFolderContentsComponent } from './forms/connect-hxdr/hxdr-projects/hxdr-project-folder-contents/hxdr-project-folder-contents.component';
import { HxdrProjectAssetDetailsComponent } from './forms/connect-hxdr/hxdr-projects/hxdr-project-asset-details/hxdr-project-asset-details.component';
import {NgxPaginationModule} from "ngx-pagination";
import {NgxJsonContextmenuModule} from "ngx-json-contextmenu";
import { NavbarComponent } from './navbar/navbar.component';
import {SidePanelComponent} from "./side-panel/side-panel.component";
import { ConnectTmsComponent } from './forms/connect-tms/connect-tms.component';
import { ConnectLtsComponent } from './forms/connect-lts/connect-lts.component';
import { ConnectAnnotationComponent } from './forms/connect-annotation/connect-annotation.component';
import { HxdrBaselayersComponent } from './forms/connect-hxdr/hxdr-baselayers/hxdr-baselayers.component';
import { ConnectWfsComponent } from './forms/connect-wfs/connect-wfs.component';
import { PortAssetComponent } from './forms/connect-annotation/port-asset/port-asset.component';
import { ConnectTiles3dComponent } from './forms/connect-tiles3d/connect-tiles3d.component';
import { TilesAttributionComponent } from './overlaycomponents/tiles-attribution/tiles-attribution.component';
import { MouseCoordinatesComponent } from './overlaycomponents/mouse-coordinates/mouse-coordinates.component';
import { ScaleIndicatorComponent } from './overlaycomponents/scale-indicator/scale-indicator.component';
import { CompassButtonComponent } from './overlaycomponents/compass-button/compass-button.component';
import { HxdrProjectsComponent } from './forms/connect-hxdr/hxdr-projects/hxdr-projects.component';
import { ControllersComponent } from './controllers/controllers.component';
import { ConnectHspcComponent } from './forms/connect-hspc/connect-hspc.component';
import { ConnectPanoramicsComponent } from './forms/connect-panoramics/connect-panoramics.component';
import { OpenHxDRLayerByIdComponent } from './forms/open-hx-drlayer-by-id/open-hx-drlayer-by-id.component';
import { HxdrSearchByIdComponent } from './forms/connect-hxdr/hxdr-search-by-id/hxdr-search-by-id.component';
import { ConnectLayergroupComponent } from './forms/connect-layergroup/connect-layergroup.component';
import { ConnectGeojsonComponent } from './forms/connect-geojson/connect-geojson.component';
import {LightningSettingsModule} from "./forms/lightning-settings/lightning-settings.module";
import {ConnectCustomPanoramicsComponent} from "./forms/connect-custom-panoramics/connect-custom-panoramics.component";

@NgModule({
  declarations: [
    AppComponent,
    LuciadMapComponent,
    LayerControlComponent,
    LayerControlNodeComponent,
    ConnectWMSFormComponent,
    ConnectHxdrComponent,
    HxdrProjectFolderComponent,
    HxdrProjectAssetComponent,
    HxdrProjectFolderContentsComponent,
    HxdrProjectAssetDetailsComponent,
    NavbarComponent,
    SidePanelComponent,
    ConnectTmsComponent,
    ConnectLtsComponent,
    ConnectAnnotationComponent,
    HxdrBaselayersComponent,
    ConnectWfsComponent,
    PortAssetComponent,
    ConnectTiles3dComponent,
    TilesAttributionComponent,
    MouseCoordinatesComponent,
    ScaleIndicatorComponent,
    CompassButtonComponent,
    HxdrProjectsComponent,
    ControllersComponent,
    ConnectHspcComponent,
    ConnectPanoramicsComponent,
    ConnectCustomPanoramicsComponent,
    OpenHxDRLayerByIdComponent,
    HxdrSearchByIdComponent,
    ConnectLayergroupComponent,
    ConnectGeojsonComponent
  ],
    imports: [
        BrowserModule,
        FontAwesomeModule,
        FormsModule,
        GraphQLModule,
        HttpClientModule,
        NgxJsonContextmenuModule,
        NgxPaginationModule,
        LightningSettingsModule,
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, far);
  }
}
