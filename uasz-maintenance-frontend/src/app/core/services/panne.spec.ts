import { TestBed } from '@angular/core/testing';
import { PannesApiService } from './pannes-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('PannesApiService', () => {
  let service: PannesApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PannesApiService);
  });

  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });
});
