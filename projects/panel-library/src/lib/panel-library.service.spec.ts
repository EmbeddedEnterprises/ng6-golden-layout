import { TestBed } from '@angular/core/testing';

import { PanelLibraryService } from './panel-library.service';

describe('PanelLibraryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PanelLibraryService = TestBed.get(PanelLibraryService);
    expect(service).toBeTruthy();
  });
});
