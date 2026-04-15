import { TestBed } from '@angular/core/testing';
import { InterventionsService } from './interventions.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('InterventionsService', () => {
  let service: InterventionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(InterventionsService);
  });

  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });
});
