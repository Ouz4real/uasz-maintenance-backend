import { TestBed } from '@angular/core/testing';
import { UtilisateursService } from './utilisateurs.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('UtilisateursService', () => {
  let service: UtilisateursService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(UtilisateursService);
  });

  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });
});
