import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LieuAutocompleteComponent, LIEUX_UASZ } from './lieu-autocomplete.component';

describe('LieuAutocompleteComponent', () => {
  let component: LieuAutocompleteComponent;
  let fixture: ComponentFixture<LieuAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LieuAutocompleteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LieuAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('doit afficher des suggestions quand on tape "amphi"', () => {
    component.onInput('amphi');
    expect(component.suggestions.length).toBeGreaterThan(0);
    expect(component.showDropdown).toBeTrue();
  });

  it('doit filtrer insensible à la casse', () => {
    component.onInput('AMPHI');
    expect(component.suggestions.length).toBeGreaterThan(0);
  });

  it('doit filtrer insensible aux accents', () => {
    component.onInput('labo');
    const hasLabo = component.suggestions.some(s =>
      s.toLowerCase().includes('labo')
    );
    expect(hasLabo).toBeTrue();
  });

  it('doit vider les suggestions si la saisie est vide', () => {
    component.onInput('amphi');
    component.onInput('');
    expect(component.suggestions.length).toBe(0);
    expect(component.showDropdown).toBeFalse();
  });

  it('doit sélectionner un lieu et fermer le dropdown', () => {
    component.onInput('amphi');
    const premier = component.suggestions[0];
    component.select(premier);
    expect(component.inputValue).toBe(premier);
    expect(component.showDropdown).toBeFalse();
  });

  it('doit naviguer avec les touches clavier ArrowDown/ArrowUp', () => {
    component.onInput('salle');
    expect(component.suggestions.length).toBeGreaterThan(0);

    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.activeIndex).toBe(0);

    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.activeIndex).toBe(1);

    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(component.activeIndex).toBe(0);
  });

  it('doit sélectionner avec Enter quand un item est actif', () => {
    component.onInput('salle');
    component.activeIndex = 0;
    const expected = component.suggestions[0];

    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.inputValue).toBe(expected);
  });

  it('doit fermer le dropdown avec Escape', () => {
    component.onInput('salle');
    expect(component.showDropdown).toBeTrue();

    component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.showDropdown).toBeFalse();
  });

  it('la liste LIEUX_UASZ doit contenir des lieux UASZ réels', () => {
    expect(LIEUX_UASZ).toContain('Rectorat');
    expect(LIEUX_UASZ).toContain('Bibliothèque Centrale');
    expect(LIEUX_UASZ.length).toBeGreaterThan(20);
  });
});
