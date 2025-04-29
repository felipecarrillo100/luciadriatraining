import {Component, EventEmitter, Input, Output} from '@angular/core';
import {GetFolderContents} from "../../../../graphql/graphql.queries";
import {Apollo} from "apollo-angular";
import {Subscription} from "rxjs";
import {LayerInfoHxDR} from "../../../utils/CreateHxDRLayerCommand";
import {number} from "@luciad/ria/util/expression/ExpressionFactory";

export interface Folder {
  id: string;
  name: string;
}

export interface AssetInFolderDetails {
  id: string;
  name: string;
  assetSize: number;
  assetStatus: string;
  assetType:string;
  createdAt: string;
  modifiedAt: string;
}

interface Contents {
  folders: Folder[];
  assets: AssetInFolderDetails[];
}

@Component({
  selector: 'app-hxdr-project-folder-contents',
  templateUrl: './hxdr-project-folder-contents.component.html',
  styleUrls: ['./hxdr-project-folder-contents.component.css']
})
export class HxdrProjectFolderContentsComponent {
  private subscription: Subscription | null =  null;
  public loading = false;
  private _folderId = "";
  public contents: Contents = {
    folders: [],
    assets: []
  }

  @Output()
  public setCurrentAsset = new EventEmitter<LayerInfoHxDR>();
  @Output()
  public openAsset = new EventEmitter<LayerInfoHxDR>();

  @Input()
  public currentAsset: LayerInfoHxDR | null = null;

  constructor(private apollo: Apollo) { }

  @Input()
  get folderId(): string {
    return this._folderId;
  }
  set folderId(value: string) {
    this._folderId = value;
    this.loading = true;
    this.subscription?.unsubscribe();
    this.loadAssets({assetsPageSize:32*5}).then(
      (contents)=>{
        this.loading = false;
        this.contents = contents
      },
      ()=>{
        this.loading = false;
        this.contents = {
          folders: [],
          assets: []
        }
      })
  }

loadAssets(options:{assetsPageSize: number}) {
    return new Promise<Contents>((resolve, reject)=>{
      const pageSize = 32;
      const pages =  options.assetsPageSize / pageSize;

      const promises = [];
      for (let page = 0; page<pages; ++page) {
        const promise = this.queryAsPromise({pageSize:32, pageNumber: page});
        promises.push(promise);
      }

      Promise.all(promises).then((results:Contents[])=>{
          const assetsArray = results.map(r=>r.assets).flat();
          const contents: Contents = {
            assets: assetsArray,
            folders: results[0].folders
          }
          resolve(contents);
      }).catch(()=>{
        reject()
      });
    })
  }

queryAsPromise(options: {pageNumber: number, pageSize: number}) {
    return new Promise<Contents>((resolve, reject) =>{
      this.apollo.query<any>({
        query: GetFolderContents,
        variables: {
          assetsOrderBy: "CREATED_AT_ASC",
          assetsPageNumber: options.pageNumber,
          assetsPageSize: options.pageSize,
          filterAssetCountByLabels: [],
          filterByLabels: [],
          assetsPageOffset: 0,
          folderId: this._folderId,
          foldersOrderBy: "CREATED_AT_ASC",
          foldersPageNumber: 0,
          foldersPageSize: 100
        },
        fetchPolicy: "network-only"
      }).subscribe((response) => {
        resolve({
          folders: response.data.getFolderContents.folders.contents as Folder[],
          assets: response.data.getFolderContents.assets.contents as AssetInFolderDetails[]
        })
      }, error => {
        reject();
      });
    })

}

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

}
