import { Component } from '@angular/core';
import {GetAllBaseLayersDocument} from "../../../graphql/grapghql.queries.baselayers";
import {Apollo} from "apollo-angular";
import {UICommandsService} from "../../../services/uicommands.service";
import {CreateHxDRLayerCommand, LayerInfoHxDR} from "../../utils/CreateHxDRLayerCommand";

const ELEVATION_ID = '14bbccd9-01ee-4fe8-8397-73c53d2713c7';

@Component({
  selector: 'app-hxdr-baselayers',
  templateUrl: './hxdr-baselayers.component.html',
  styleUrls: ['./hxdr-baselayers.component.css']
})
export class HxdrBaselayersComponent {
  public loading: boolean = false;
  private subscription: any;
  public contents: any[] = [];
  public autoZoom =  true;
  private currentLayer: LayerInfoHxDR | null = null;

  constructor(private apollo: Apollo, private uiCommandsService: UICommandsService) {
  }

  ngOnInit(): void {
    this.loading = true;
    this.subscription = this.apollo.watchQuery<any>({
      query: GetAllBaseLayersDocument,
      variables: {
        pageNumber: 0,
        pageSize: 100,
      },
      fetchPolicy: "network-only"
    }).valueChanges.subscribe((response) => {
      this.loading = false;
      this.contents = response.data.getAllBaselayers.contents.filter((i:any)=>typeof i.endpoint!== "undefined");
    },error => {
      this.loading = false;
      console.error(error);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  isCurrent(item: any) {
    const layerInfo: LayerInfoHxDR = {
      id: item.id,
      name: item.label,
      type: item.type,
      endpoint: item.endpoint
    }
    if (!this.currentLayer) return false;
    return this.currentLayer.id === layerInfo.id && this.currentLayer.endpoint === layerInfo.endpoint;
  }
  setCurrentLayer(item: any) {
    const layerInfo: LayerInfoHxDR = {
      id: item.id,
      name: item.label,
      type: item.type,
      endpoint: item.endpoint
    }
    this.currentLayer = layerInfo;
  }

  openLayer(item: any) {
    console.log(item);
    const layerInfo: LayerInfoHxDR = {
      id: item.id,
      name: item.label,
      type: item.type,
      endpoint: item.endpoint
    }
    this.emitCreateLayerCommand(layerInfo);
  }

  emitCreateLayerCommand(layerInfo: LayerInfoHxDR) {
    CreateHxDRLayerCommand(layerInfo).then(command=>{
      command.parameters.autoZoom = this.autoZoom;
      this.uiCommandsService.submitCommand(command);
    }, ()=>{
      console.log(`Was not able to create command: ${layerInfo.name} ${layerInfo.type}`)
    })
  }

  openCurrent($event: SubmitEvent) {
    if (this.currentLayer) {
      this.emitCreateLayerCommand(this.currentLayer);
    }
  }
}
