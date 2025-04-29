import { Injectable } from '@angular/core';
import { UICommand } from '../../modules/luciad/interfaces/UICommand';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapLayerCommandsService {
  private subjectCommand = new Subject<UICommand>();

  applyLayer(command: UICommand): void {
    this.subjectCommand.next(command);
  }

  onCommand(): Observable<UICommand> {
    return this.subjectCommand.asObservable();
  }
}
