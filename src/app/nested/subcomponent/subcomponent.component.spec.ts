import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubcomponentComponent } from './subcomponent.component';

describe('SubcomponentComponent', () => {
  let component: SubcomponentComponent;
  let fixture: ComponentFixture<SubcomponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubcomponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubcomponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
