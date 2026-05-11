import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Placeholder - aucun service Piece autonome dans ce projet
describe('Services HTTP', () => {
  it('HttpClientTestingModule doit être disponible', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    expect(true).toBeTrue();
  });
});
