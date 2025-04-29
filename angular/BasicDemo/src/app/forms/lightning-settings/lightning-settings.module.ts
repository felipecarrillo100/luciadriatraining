import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {LightningSettingsComponent} from "./lightning-settings.component";
import {MoreComponent} from "./more/more.component";
import {AmbientLightComponent} from "./ambient-light/ambient-light.component";
import {AtmosphereComponent} from "./atmosphere/atmosphere.component";
import {SunlightComponent} from "./sunlight/sunlight.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    MoreComponent,
    AmbientLightComponent,
    AtmosphereComponent,
    SunlightComponent,
    LightningSettingsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class LightningSettingsModule { }
