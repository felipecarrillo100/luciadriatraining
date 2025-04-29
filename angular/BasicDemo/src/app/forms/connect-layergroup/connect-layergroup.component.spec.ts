import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectLayergroupComponent } from './connect-layergroup.component';

describe('ConnectLayergroupComponent', () => {
  let component: ConnectLayergroupComponent;
  let fixture: ComponentFixture<ConnectLayergroupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectLayergroupComponent]
    });
    fixture = TestBed.createComponent(ConnectLayergroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
