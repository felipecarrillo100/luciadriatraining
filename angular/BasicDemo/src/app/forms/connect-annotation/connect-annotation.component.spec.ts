import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectAnnotationComponent } from './connect-annotation.component';

describe('ConnectAnnotationComponent', () => {
  let component: ConnectAnnotationComponent;
  let fixture: ComponentFixture<ConnectAnnotationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectAnnotationComponent]
    });
    fixture = TestBed.createComponent(ConnectAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
