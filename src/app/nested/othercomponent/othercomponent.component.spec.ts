import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OthercomponentComponent } from './othercomponent.component';

describe('OthercomponentComponent', () => {
  let component: OthercomponentComponent;
  let fixture: ComponentFixture<OthercomponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OthercomponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OthercomponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
