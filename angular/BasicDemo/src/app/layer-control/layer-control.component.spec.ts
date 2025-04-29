import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerControlComponent } from './layer-control.component';

describe('LayerControlComponent', () => {
  let component: LayerControlComponent;
  let fixture: ComponentFixture<LayerControlComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LayerControlComponent]
    });
    fixture = TestBed.createComponent(LayerControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
