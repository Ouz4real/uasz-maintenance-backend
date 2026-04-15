import { TestBed } from '@angular/core/testing';
import { SuperviseurApiService } from './superviseur-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SuperviseurApiService', () => {
  let service: SuperviseurApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SuperviseurApiService);
  });

  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });
});
