import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EquipementAutocompleteComponent, EQUIPEMENTS_UNIVERSITE } from './equipement-autocomplete.component';

describe('EquipementAutocompleteComponent', () => {
  let component: EquipementAutocompleteComponent;
  let fixture: ComponentFixture<EquipementAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipementAutocompleteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipementAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('doit afficher des suggestions quand on tape "ordi"', () => {
    component.onInput('ordi');
    expect(component.suggestions.length).toBeGreaterThan(0);
    expect(component.showDropdown).toBeTrue();
  });

  it('doit trouver "Vidéoprojecteur" en tapant "video"', () => {
    component.onInput('video');
    const found = component.suggestions.some(s =>
      s.toLowerCase().includes('vid')
    );
    expect(found).toBeTrue();
  });

  it('doit trouver "Climatiseur" en tapant "clim"', () => {
    component.onInput('clim');
    expect(component.suggestions.length).toBeGreaterThan(0);
  });

  it('doit filtrer insensible à la casse', () => {
    component.onInput('IMPRIMANTE');
    const found = component.suggestions.some(s =>
      s.toLowerCase().includes('imprimante')
    );
    expect(found).toBeTrue();
  });

  it('doit vider les suggestions si la saisie est vide', () => {
    component.onInput('ordi');
    component.onInput('');
    expect(component.suggestions.length).toBe(0);
    expect(component.showDropdown).toBeFalse();
  });

  it('doit sélectionner un équipement et fermer le dropdown', () => {
    component.onInput('ordi');
    const premier = component.suggestions[0];
    component.select(premier);
    expect(component.inputValue).toBe(premier);
    expect(component.showDropdown).toBeFalse();
  });

  it('doit fermer le dropdown avec Escape', () => {
    component.onInput('ordi');
    component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.showDropdown).toBeFalse();
  });

  it('la liste EQUIPEMENTS_UNIVERSITE doit contenir les équipements essentiels', () => {
    expect(EQUIPEMENTS_UNIVERSITE).toContain('Ordinateur de bureau');
    expect(EQUIPEMENTS_UNIVERSITE).toContain('Vidéoprojecteur');
    expect(EQUIPEMENTS_UNIVERSITE).toContain('Climatiseur split');
    expect(EQUIPEMENTS_UNIVERSITE).toContain('Extincteur');
    expect(EQUIPEMENTS_UNIVERSITE.length).toBeGreaterThan(50);
  });
});
