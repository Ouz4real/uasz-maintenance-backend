import { TestBed } from '@angular/core/testing';

import { Panne } from './panne';

describe('Panne', () => {
  let service: Panne;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Panne);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
