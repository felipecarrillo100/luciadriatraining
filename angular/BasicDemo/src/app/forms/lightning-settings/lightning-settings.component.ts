import {Component, Input} from '@angular/core';
import {ConfigureLightningSettingsService, DefaultMapEffects, MapEffects} from "./configure-lightning-settings.service";
import {MainMapService} from "../../services/main-map.service";

type TabModes = "Sunlight" | "Atmosphere" | "AmbientLight" | "More";
@Component({
  selector: 'app-lightning-settings',
  templateUrl: './lightning-settings.component.html',
  styleUrls: ['./lightning-settings.component.css']
})
export class LightningSettingsComponent {
  public currenttab:  TabModes = "Sunlight";
  public editableSettings: MapEffects;

  @Input()
  public close: ()=>void = ()=>{};

  constructor(
    private configureLightningSettingsService: ConfigureLightningSettingsService,
    private mainMapService: MainMapService
  ) {
    this.editableSettings = this.configureLightningSettingsService.getEditableSettings();
  }

  setTab(tab: TabModes) {
     this.currenttab = tab;
  }


  settingChanged() {
    const map = this.mainMapService.getMap();
    if (map) {
      this.configureLightningSettingsService.applyEditableSettingsToMap(map);
    }
  }

  onCancel() {
    this.rollBackSettings();
    this.close();
  }



  onOK() {
    this.configureLightningSettingsService.commitEditableSettings();
    this.close();
    const settings = this.configureLightningSettingsService.getCurrentSettings();
    this.configureLightningSettingsService.syncEditableSettings();
    console.log(JSON.stringify(settings, null, 2));
  }

  onRestore() {
      this.configureLightningSettingsService.setEditableSettings(DefaultMapEffects);
      this.editableSettings = this.configureLightningSettingsService.getEditableSettings();
      this.settingChanged();
  }

  canClose = ()=> {
    this.rollBackSettings();
    return true;
  }

  rollBackSettings() {
    const map = this.mainMapService.getMap();
    if (map) {
      this.configureLightningSettingsService.syncEditableSettings();
      this.configureLightningSettingsService.applyCurrentSettingsToMap(map);
    }
  }
}
