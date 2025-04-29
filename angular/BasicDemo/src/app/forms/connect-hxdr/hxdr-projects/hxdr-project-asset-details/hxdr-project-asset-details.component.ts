import {Component, EventEmitter, Input, Output} from '@angular/core';
import {HxDRGetAssetDetailsNew} from "../../../../graphql/graphql.queries";
import {Apollo} from "apollo-angular";
import {Subscription} from "rxjs";
import {ArtifactSimplified, LayerInfoHxDR} from "../../../utils/CreateHxDRLayerCommand";
import {AppSettings} from "../../../../settings/AppSettings";
import {AssetInFolderDetails} from "../hxdr-project-folder-contents/hxdr-project-folder-contents.component";
import {isValidAssetLayerType, ValidAssetTypeCategories, LayeerTypeTranslate} from "../../../utils/HcDRLayerInterfaces";


@Component({
  selector: 'app-hxdr-project-asset-details',
  templateUrl: './hxdr-project-asset-details.component.html',
  styleUrls: ['./hxdr-project-asset-details.component.css']
})
export class HxdrProjectAssetDetailsComponent {
  private subscription: Subscription | null = null;
  public artifacts: any = null;
  public loading = false;

  @Output()
  public setCurrentAsset = new EventEmitter<LayerInfoHxDR>();
  @Output()
  public openAsset = new EventEmitter<LayerInfoHxDR>();

  @Input()
  public currentAsset: LayerInfoHxDR | null = null;

  @Input()
  public asset: AssetInFolderDetails | null = null;

  constructor(private apollo: Apollo) { }

  ngOnInit(): void {
    this.loading = true;
    this.subscription = this.apollo.watchQuery<any>({
      query: HxDRGetAssetDetailsNew,
      variables: {
        id: this.asset?.id
      },
      fetchPolicy: "network-only"
    }).valueChanges.subscribe((response) => {
      this.loading = false;
      const filteredData = response.data.asset.asset.artifacts.contents.filter((item:any)=>{
        if (!ValidAssetTypeCategories.includes(item.dataCategory)) return false;
        return item.addresses.contents.some(isValidAssetLayerType);
      })
      this.artifacts = filteredData.map((item: any)=>{
        let hasDownloadLink = false;
        if (item.addresses.contents.find((i:any)=>i.consumptionType==="DOWNLOADABLE")){
          hasDownloadLink = true;
        }
        return {
          "type": item.dataCategory,
          "addresses": item.addresses.contents,
          hasDownloadLink,
          artifactId: item.id,
        }});
    },error => {
      this.loading = false;
      this.artifacts = [];
      console.error(error);
    });
  }

  private endpointType = (addresses: any) => {
    const endpoint = {
      type: null as string | null,
      endpoint: "",
      id: ""
    }
    for (const address of addresses) {
      if (isValidAssetLayerType(address)) {
        // @ts-ignore
        endpoint.type = LayeerTypeTranslate[address.serviceType];
        endpoint.endpoint = address.endpoint;
        endpoint.id = address.id;
        break;
      }
    }
    return endpoint;
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  selectAsset(artifact: ArtifactSimplified) {
    const mode = this.endpointType(artifact.addresses);
    const layerInfo: LayerInfoHxDR = {
      id: this.asset?.id as string,
      name: this.asset?.name as string,
      type: mode.type as any,
      endpoint: mode.endpoint,
      addressId: mode.id
    }
    this.setCurrentAsset.emit(layerInfo);
  }

  isCurrent(artifact: ArtifactSimplified) {
    const mode = this.endpointType(artifact.addresses);
    const layerInfo: LayerInfoHxDR = {
      id: this.asset?.id as string,
      name: this.asset?.name as string,
      type: mode.type as any,
      endpoint: mode.endpoint,
      addressId: mode.id
    }
    if (!this.currentAsset) return false;
    return this.currentAsset.id === layerInfo.id && this.currentAsset.type === layerInfo.type && this.currentAsset.endpoint === layerInfo.endpoint;
  }

  openLayer(artifact: ArtifactSimplified) {
    const mode = this.endpointType(artifact.addresses);
    const layerInfo: LayerInfoHxDR = {
      id: this.asset?.id as string,
      name: this.asset?.name as string,
      type: mode.type as any,
      artifactId: artifact.artifactId,
      endpoint: mode.endpoint,
      addressId: mode.id
    }
    this.openAsset.emit(layerInfo);
  }

  downloadAssetOrig(artifact: ArtifactSimplified) {
    const downloadAddress = artifact.addresses.find((i:any)=>i.consumptionType==="DOWNLOADABLE");
    let anchor = document.createElement("a");
    document.body.appendChild(anchor);

    let headers = new Headers();
    const baseUrl = AppSettings.HxDRServer;
    const accessToken = AppSettings.getToken();
    headers.append('Authorization', `Bearer ${accessToken}`);

    const request = `${baseUrl}${downloadAddress.endpoint}`
    fetch(request, { headers })
      .then(response => response.blob())
      .then(blobby => {
        let objectUrl = window.URL.createObjectURL(blobby);

        anchor.href = objectUrl;
        anchor.download = `${artifact.type}.zip`;
        anchor.click();

        window.URL.revokeObjectURL(objectUrl);
      });
  }

  downloadAsset(artifact: ArtifactSimplified) {
    const downloadAddress = artifact.addresses.find((i:any)=>i.consumptionType==="DOWNLOADABLE");
    let anchor = document.createElement("a");
    document.body.appendChild(anchor);

    let headers = new Headers();
    const baseUrl = AppSettings.HxDRServer;
    const accessToken = AppSettings.getToken();
    headers.append('Authorization', `Bearer ${accessToken}`);

    const request = `${baseUrl}${downloadAddress.endpoint}`
    fetch(request, { headers })
      // Retrieve its body as ReadableStream
      .then((response) => {
        // @ts-ignore
        const reader = response.body.getReader();
        return new ReadableStream({
          start(controller) {
            return pump();
            // @ts-ignore
            function pump() {
              return reader.read().then(({ done, value }) => {
                // When no more data needs to be consumed, close the stream
                if (done) {
                  controller.close();
                  return;
                }
                // Enqueue the next data chunk into our target stream
                controller.enqueue(value);
                return pump();
              });
            }
          },
        });
      })
      // Create a new response out of the stream
      .then((stream) => new Response(stream))
      // Create an object URL for the response
      .then((response) => response.blob())
      .then((blob) => URL.createObjectURL(blob))
      // Update image
      .then((url) => {
        anchor.href = url;
        anchor.download = `${artifact.type}.zip`;
        anchor.click();

       // window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error(err));
  }

  validAsset(artifact: ArtifactSimplified) {
    const address = artifact.addresses.find((i:any)=>i.consumptionType!=="DOWNLOADABLE");
    return address.processingPipelineInfo.status !== "FAILED";
  }
}
