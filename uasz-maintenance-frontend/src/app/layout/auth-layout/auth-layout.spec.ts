import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthLayout } from './auth-layout';
import { RouterTestingModule } from '@angular/router/testing';

describe('AuthLayout', () => {
  let component: AuthLayout;
  let fixture: ComponentFixture<AuthLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLayout, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });
});
