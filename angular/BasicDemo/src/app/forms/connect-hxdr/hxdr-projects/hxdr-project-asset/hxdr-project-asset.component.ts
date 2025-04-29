import {Component, EventEmitter, Input, Output} from '@angular/core';
import {LayerInfoHxDR} from "../../../utils/CreateHxDRLayerCommand";
import {AssetInFolderDetails} from "../hxdr-project-folder-contents/hxdr-project-folder-contents.component";

@Component({
  selector: 'app-hxdr-project-asset',
  templateUrl: './hxdr-project-asset.component.html',
  styleUrls: ['./hxdr-project-asset.component.css']
})
export class HxdrProjectAssetComponent {
  @Output()
  public setCurrentAsset = new EventEmitter<LayerInfoHxDR>();
  @Output()
  public openAsset = new EventEmitter<LayerInfoHxDR>();

  @Input()
  public currentAsset: LayerInfoHxDR | null = null;

  @Input()
  public asset: AssetInFolderDetails | null = null;
  // @Input()
  // public assetId: string | null = null;
  // @Input()
  // public assetName: string | null = null;

  public expanded: boolean = false;

  toggleExpanded() {
    this.expanded = !this.expanded;
  }
}
