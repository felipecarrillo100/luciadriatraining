import { Component } from '@angular/core';
import {Apollo} from "apollo-angular";
import {GetProjectsV2} from "../../../graphql/graphql.queries";
import {Subscription} from "rxjs";
import {
  CreateHxDRLayerCommand,
  CreateHxDRLayerFromProjectAssetCommand,
  LayerInfoHxDR
} from "../../utils/CreateHxDRLayerCommand";
import {UICommandsService} from "../../../services/uicommands.service";
import {UILayerTypes} from "../../../interfaces/UILayerTypes";

export interface Project {
  createdAt: string;
  description: string;
  id: string;
  modifiedAt: string;
  name: string;
  ownedBy:
    {__typename: string, id: string, signedUpAt: string, jobTitle: string, firstName: string};
  projectMembers:
    {__typename: string; contents: any};
  rootFolder :
    {__typename: string; id: string};
  thumbnailPath :string;
  totalAssets: number;
  __typename: string;
}
@Component({
  selector: 'app-hxdr-projects',
  templateUrl: './hxdr-projects.component.html',
  styleUrls: ['./hxdr-projects.component.css']
})
export class HxdrProjectsComponent {
  public allProjects: number = 0;
  public pagination: number = 1;
  public loading = false;
  public projects: Project[] = [];
  public currentProject: Project[] = [];
  public pageSize = 10;
  private projectName = "";
  private subscription: Subscription | null = null;
  public failedToConnect = false;
  public autoZoom=true;
  public offsetTerrain: boolean= true;
  public isDrapeTarget: boolean = true;
  currentAsset: LayerInfoHxDR | null = null;
  constructor(private apollo: Apollo, private uiCommandsService: UICommandsService) { }

  ngOnInit(): void {
    this.reloadProjects();
  }

  private reloadProjects() {
    this.loading = true;
    this.failedToConnect = false;
    this.subscription = this.apollo.watchQuery<any>({
      query: GetProjectsV2,
      variables: {
        pageSize: this.pageSize,
        pageNumber: this.pagination - 1,
        filterByName: this.projectName,
        orderBy: "CREATED_AT_ASC"
      },
      fetchPolicy: "network-only"
    }).valueChanges.subscribe((response) => {
      this.loading = false;
      this.projects = response.data.projectsV2.contents as Project[];
      const total = (response.data && response.data.projectsV2) ? response.data.projectsV2.total : 0;
      this.allProjects = total;
    },error => {
      this.failedToConnect = true;
      this.loading = false;
      this.projects = [];
      this.allProjects = 0;
      console.error(error);
    });
  }
  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  setCurrent(project: Project) {
    this.currentProject = [project];
  }

  renderPage(event: number) {
    this.pagination = event;
    this.reloadProjects();
  }

  setCurrentAsset(layerInfoHxDR: LayerInfoHxDR) {
    this.currentAsset=layerInfoHxDR;
  }

  openAsset(layerInfoHxDR: LayerInfoHxDR) {
    console.log('HxDR LayerInfo',JSON.stringify(layerInfoHxDR, null, 2));
    CreateHxDRLayerFromProjectAssetCommand(this.apollo, layerInfoHxDR).then(command=>{
      if (command) {
        command.parameters.autoZoom = this.autoZoom;
        if (command.parameters.layerType === UILayerTypes.HSPCLayer || command.parameters.layerType === UILayerTypes.OGC3DTILES) {
          command.parameters.layer.offsetTerrain = this.offsetTerrain;
        }
        if (command.parameters.layerType === UILayerTypes.OGC3DTILES) {
          command.parameters.layer.isDrapeTarget = this.isDrapeTarget;
        }
        this.uiCommandsService.submitCommand(command);
      }
    })
  }

  openAssetOld(layerInfoHxDR: LayerInfoHxDR) {
    console.log('HxDR LayerInfo',JSON.stringify(layerInfoHxDR, null, 2));
    CreateHxDRLayerCommand(layerInfoHxDR).then(command=>{
      command.parameters.autoZoom = this.autoZoom;
      if (command.parameters.layerType === UILayerTypes.HSPCLayer || command.parameters.layerType === UILayerTypes.OGC3DTILES) {
        command.parameters.layer.offsetTerrain = this.offsetTerrain;
      }
      if (command.parameters.layerType === UILayerTypes.OGC3DTILES) {
        command.parameters.layer.isDrapeTarget = this.isDrapeTarget;
      }
      this.uiCommandsService.submitCommand(command);
    }, ()=>{
      console.log(`Was not able to create command: ${layerInfoHxDR.name} ${layerInfoHxDR.type}`)
    })
  }

  openCurrent(event: SubmitEvent) {
    if (this.currentAsset) {
      this.openAsset(this.currentAsset);
    }
  }
}
