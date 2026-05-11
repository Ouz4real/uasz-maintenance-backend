import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  // ===== Tests isEmailUaszValide =====

  it('email @zig.univ.sn doit être valide', () => {
    expect(component.isEmailUaszValide('o.m6@zig.univ.sn')).toBeTrue();
  });

  it('email @univ-zig.sn doit être valide', () => {
    expect(component.isEmailUaszValide('kgaye@univ-zig.sn')).toBeTrue();
  });

  it('email @gmail.com doit être invalide', () => {
    expect(component.isEmailUaszValide('user@gmail.com')).toBeFalse();
  });

  it('email @yahoo.fr doit être invalide', () => {
    expect(component.isEmailUaszValide('user@yahoo.fr')).toBeFalse();
  });

  it('email vide doit retourner true (pas d\'erreur si vide)', () => {
    expect(component.isEmailUaszValide('')).toBeTrue();
  });

  it('email en majuscules doit être accepté', () => {
    expect(component.isEmailUaszValide('USER@ZIG.UNIV.SN')).toBeTrue();
  });

  // ===== Tests togglePasswordVisibility =====

  it('togglePasswordVisibility doit basculer showPassword', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalse();
  });

  // ===== Tests état initial =====

  it('le formulaire doit être vide au départ', () => {
    expect(component.formData.email).toBe('');
    expect(component.formData.username).toBe('');
    expect(component.formData.motDePasse).toBe('');
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('');
  });

  // ===== Tests soumission avec email invalide =====

  it('onSubmit avec email non-UASZ doit afficher un message d\'erreur', () => {
    component.formData.email = 'test@gmail.com';
    component.onSubmit();
    expect(component.errorMessage).toContain('UASZ');
  });
});
