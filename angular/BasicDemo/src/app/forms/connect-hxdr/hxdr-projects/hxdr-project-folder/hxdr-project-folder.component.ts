import {Component, EventEmitter, Input, Output} from '@angular/core';
import {LayerInfoHxDR} from "../../../utils/CreateHxDRLayerCommand";
@Component({
  selector: 'app-hxdr-project-folder',
  templateUrl: './hxdr-project-folder.component.html',
  styleUrls: ['./hxdr-project-folder.component.css']
})
export class HxdrProjectFolderComponent {

  @Output()
  public setCurrentAsset = new EventEmitter<LayerInfoHxDR>();
  @Output()
  public openAsset = new EventEmitter<LayerInfoHxDR>();

  @Input()
  public currentAsset: LayerInfoHxDR | null = null;

  @Input()
  public folderName: string = "";

  @Input()
  public folderId = "";
  public expanded: boolean = false;

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

}
