import {Component, Input, ViewChild, ViewContainerRef} from '@angular/core';
import {UICommandsService} from "../services/uicommands.service";
import {UICommand} from "../services/interfaces/UICommand";
import {UICommandActions} from "../interfaces/UICommandActions";

@Component({
  selector: 'app-side-panel',
  templateUrl: './side-panel.component.html',
  styleUrls: ['./side-panel.component.css']
})
export class SidePanelComponent {

  visible: boolean = false;

  @Input()
  formProvider: (formName: string) => any = () => null;

  @ViewChild('SidePanelContainer', {
    read: ViewContainerRef,
    static: false
  })
    // @ts-ignore
  sample: ViewContainerRef;

  openPanel = () => {
    this.visible = true;
  }

  constructor(private commandsService: UICommandsService) {
    this.commandsService.onCommand().subscribe((command: UICommand)=>{
      this.processCommand(command);
    })
  }

  closePanel = ()=> {
    if (this.canClose()) {
      this.visible = false;
      this.sample.clear();
      this.canClose = () => {return true}
    }
  }

  canClose = () => {
    return true;
  }
  createComponent( component: any) {
    if (this.sample) {
      this.sample.clear();
      let page1ComponentRef = this.sample.createComponent(component);
      (page1ComponentRef.instance as any).close = this.closePanel;
      this.canClose = (page1ComponentRef.instance as any).canClose ?  (page1ComponentRef.instance as any).canClose :  () => {
        return true;
      };
    }
  }
  openForm(form: any) {
    if (this.canClose()) {
      if (this.visible) this.closePanel();
      setTimeout(() => {
        this.openPanel();
        this.createComponent(form);
      }, 100)
    }
  }
  private processCommand(command: UICommand) {
    switch (command.action) {
      case UICommandActions.ShowForm:
           const form = this.formProvider(command.parameters.formName);
           if (form) {
             this.openForm(form);
           } else {
             console.error("No form was found");
           }
        break;
    }
  }
}
