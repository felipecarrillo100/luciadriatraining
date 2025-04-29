import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectWfsComponent } from './connect-wfs.component';

describe('ConnectWfsComponent', () => {
  let component: ConnectWfsComponent;
  let fixture: ComponentFixture<ConnectWfsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectWfsComponent]
    });
    fixture = TestBed.createComponent(ConnectWfsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
