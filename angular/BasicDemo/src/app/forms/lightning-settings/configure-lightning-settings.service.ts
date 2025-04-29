import { Injectable } from '@angular/core';
import {WebGLMap} from "@luciad/ria/view/WebGLMap";
import {createSunLight} from "@luciad/ria/view/LightEffect";
import {LightScatteringAtmosphere} from "@luciad/ria/view/LightScatteringAtmosphere";


export interface MapEffects  {
  antiAliasing: {
    enabled: boolean
  },
  eyeDomeLighting: {
    window: number;
    strength: number;
    enabled: boolean;
    color: string;
  },
  focus: {
    distance: number;
    range: number;
    enabled: boolean;
  },
  ambientOclusion: {
    power: number;
    radius: number;
    enabled: boolean;
  },
  lightning: {
    shadows: boolean;
    enabled: boolean;
    ambientColor: string;
    diffuseColor: string;
    time: number;
  },
  atmosphere: {
    enabled: boolean;
    brightness: number;
    rayleighScatteringFactor: number;
    mieScatteringFactor: number;
    affectsTerrain: boolean;
  }
}

export const DefaultMapEffects: MapEffects = {
  antiAliasing: {
    enabled: false
  },
  eyeDomeLighting: {
    window: 2,
    strength: 0.1,
    enabled: false,
    color: "rgb(0,0,0)"
  },
  focus: {
    distance: 500,
    range: 500,
    enabled: false
  },
  ambientOclusion: {
    power: 1.2,
    radius: 20,
    enabled: true,
  },
  lightning: {
    enabled: false,
    shadows: true,
    ambientColor: "rgb(64,64,64)",
    diffuseColor: "rgb(255,255,255)",
    time: 1698379562 - 24*60*60 * 3 * 30 - 18*60*60
  },
  atmosphere: {
    enabled: true,
    brightness: 2.0,
    rayleighScatteringFactor: 1.0,
    mieScatteringFactor: 1.0,
    affectsTerrain: false
  }
}


@Injectable({
  providedIn: "root"
})
export class ConfigureLightningSettingsService {
  private settings: MapEffects = JSON.parse(JSON.stringify(DefaultMapEffects));
  private editableSettings: MapEffects = JSON.parse(JSON.stringify(DefaultMapEffects));

  constructor() {
  }

  public applyCurrentSettingsToMap(map: WebGLMap) {
    this.applyAll3DEffects(map, this.settings);
  }

  public applyEditableSettingsToMap(map: WebGLMap) {
    this.applyAll3DEffects(map, this.editableSettings);
  }

  public setEditableSettings(settings: MapEffects) {
    this.editableSettings = JSON.parse(JSON.stringify(settings));
  }

  public getEditableSettings() {
    return this.editableSettings;
  }

  commitEditableSettings() {
    this.settings = JSON.parse(JSON.stringify(this.editableSettings));
  }

  syncEditableSettings() {
    this.editableSettings = JSON.parse(JSON.stringify(this.settings));
  }

  getCurrentSettings() {
    return this.settings;
  }

  private applyAll3DEffects(map: WebGLMap, effects: MapEffects) {
    const time = typeof effects.lightning.time !== "undefined" ? new Date(effects.lightning.time*1000) : new Date();  // HERE
    if (effects.ambientOclusion && effects.ambientOclusion.enabled){
      map.effects.ambientOcclusion = {radius: effects.ambientOclusion.radius, power: effects.ambientOclusion.power};
    } else {
      map.effects.ambientOcclusion = null;
    }
    if (effects.antiAliasing && typeof effects.antiAliasing.enabled !== "undefined"){
      map.effects.antiAliasing = effects.antiAliasing.enabled;
    } else {
      map.effects.antiAliasing = false;
    }

    if (effects.focus.enabled) {
      map.effects.depthOfField = { focalDepth: effects.focus.distance, focusRange: effects.focus.range};
    } else {
      map.effects.depthOfField = null;
    }
    if (effects.eyeDomeLighting && effects.eyeDomeLighting.enabled) {
      map.effects.eyeDomeLighting = { window: effects.eyeDomeLighting.window, strength: effects.eyeDomeLighting.strength, color: effects.eyeDomeLighting.color};
    } else {
      map.effects.eyeDomeLighting = null;
    }

    if(effects.lightning.enabled) {
      map.effects.light = createSunLight({
        time,
        shadows: effects.lightning.shadows,
        ambientColor: effects.lightning.ambientColor,
        diffuseColor: effects.lightning.diffuseColor,
      });
    } else {
      map.effects.light =  null;
    }

    if(effects.atmosphere && effects.atmosphere.enabled) {
      map.effects.atmosphere = new LightScatteringAtmosphere({
        brightness: effects.atmosphere.brightness,
        rayleighScatteringFactor: effects.atmosphere.rayleighScatteringFactor,
        mieScatteringFactor: effects.atmosphere.mieScatteringFactor,
        affectsTerrain: effects.atmosphere.affectsTerrain
      });
    } else {
      map.effects.atmosphere =  null;
    }
  }

  writeAt(aObj: MapEffects, value: any, aPath: string) {
      const path = aPath.split('.');
      let obj = aObj as any;
      let i: any;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
      }
      obj[path[i]] = value;
  }

}
