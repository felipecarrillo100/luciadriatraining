import { Injectable } from '@angular/core';
import {UICommand} from "./interfaces/UICommand";
import {Observable, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UICommandsService {
  private subjectCommand = new Subject<UICommand>();
  constructor() { }

  submitCommand(command: UICommand): void {
    this.subjectCommand.next(command);
  }
  onCommand(): Observable<UICommand> {
    return this.subjectCommand.asObservable();
  }
}
