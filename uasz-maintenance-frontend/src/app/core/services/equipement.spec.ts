import { TestBed } from '@angular/core/testing';
import { EquipementsApiService } from './equipements-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('EquipementsApiService', () => {
  let service: EquipementsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(EquipementsApiService);
  });

  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });
});
