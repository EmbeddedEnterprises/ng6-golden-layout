import { TestBed } from '@angular/core/testing';

import { NgxGoldenLayoutService } from './ngx-golden-layout.service';

describe('NgxGoldenLayoutService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgxGoldenLayoutService = TestBed.get(NgxGoldenLayoutService);
    expect(service).toBeTruthy();
  });
});
