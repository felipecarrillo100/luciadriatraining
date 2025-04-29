import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectHspcComponent } from './connect-hspc.component';

describe('ConnectHspcComponent', () => {
  let component: ConnectHspcComponent;
  let fixture: ComponentFixture<ConnectHspcComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectHspcComponent]
    });
    fixture = TestBed.createComponent(ConnectHspcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
