import { Component } from '@angular/core';
import {Apollo} from "apollo-angular";
import {UICommandsService} from "../../../services/uicommands.service";
import {HxDRGetAssetDetailsNew} from "../../../graphql/graphql.queries";
import {CreateHxDRLayerFromProjectAssetCommand, LayerInfoHxDR} from "../../utils/CreateHxDRLayerCommand";
import {LayeerTypeTranslate} from "../../utils/HcDRLayerInterfaces";
import {UICommand} from "../../../services/interfaces/UICommand";


interface Address {
  consumptionType: string;
  endpoint: string;
  id: string;
  label: string;
  processingPipelineInfo: any;
  serviceType: string;
  __typename: string;
}
interface Addresses {
  __typename: string;
  contents: Address[];
}
interface Artifact {
  __typename: string;
  id: string;
  dataCategory: string;
  addresses: any;
}

@Component({
  selector: 'app-hxdr-search-by-id',
  templateUrl: './hxdr-search-by-id.component.html',
  styleUrls: ['./hxdr-search-by-id.component.css']
})
export class HxdrSearchByIdComponent {
  public assetId: string = "caa2c5a3-4fd5-4927-a86d-a087f6867460";
  public asset: any = null;
  public artifacts: Artifact[] = [];

  constructor(private apollo: Apollo, private uiCommandsService: UICommandsService) {
  }

  getAsset() {
    this.apollo.query<any>({
      query: HxDRGetAssetDetailsNew,
      variables: {
        id: this.assetId,
      },
      fetchPolicy: "network-only"
    }).subscribe((response) => {
      this.asset = response.data.asset;
      this.artifacts = this.asset.asset.artifacts.contents;
      console.log(this.artifacts);
    },error => {
      console.error(error);
    });
  }

  openHxDR(artifact: Artifact, address: Address) {
    const layerInfoHxDR: LayerInfoHxDR = {
        name: this.asset.name,
        id: this.asset.id,
        artifactId: artifact.id,
        addressId: address.id,
        endpoint: address.endpoint,
      // @ts-ignore
        type: LayeerTypeTranslate[address.serviceType]
      }
      console.log(JSON.stringify(layerInfoHxDR,null,2))
      CreateHxDRLayerFromProjectAssetCommand(this.apollo, layerInfoHxDR).then(command=>{
        if (command) {
          command.parameters.autoZoom = true;
          if (layerInfoHxDR.type==="HSPC" || layerInfoHxDR.type==="OGC_3D_TILES") {
            command.parameters.layer.offsetTerrain = false;
          }
          if (layerInfoHxDR.type==="OGC_3D_TILES") {
            command.parameters.layer.isDrapeTarget = false;
          }
          this.uiCommandsService.submitCommand(command as UICommand);
        }
      }, ()=>{
        console.log(`Was not able to create command: ${layerInfoHxDR.name} ${layerInfoHxDR.type}`)
      })
  }

  protected readonly LayeerTypeTranslate = LayeerTypeTranslate;

  protected translatename(serviceType: any) {
    // @ts-ignore
    return LayeerTypeTranslate[serviceType];
  }
}
