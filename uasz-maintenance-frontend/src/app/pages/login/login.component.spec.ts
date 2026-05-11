import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('le formulaire doit être invalide si vide', () => {
    expect(component.loginForm.valid).toBeFalse();
  });

  it('le formulaire doit être valide avec username et password', () => {
    component.loginForm.setValue({
      username: 'admin',
      password: 'password123',
      rememberMe: false
    });
    expect(component.loginForm.valid).toBeTrue();
  });
});
