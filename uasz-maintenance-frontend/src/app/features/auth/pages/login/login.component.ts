import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AuthResponse, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    usernameOrEmail: ['', Validators.required],
    motDePasse: ['', [Validators.required, Validators.minLength(4)]],
  });

  loading = false;
  errorMessage = '';

  hasError(controlName: string, errorCode: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.touched && control.hasError(errorCode);
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload: LoginRequest = this.form.value as LoginRequest;

    this.authService.login(payload).subscribe({
      next: (res: AuthResponse) => {
        console.log('Connecté avec succès : ', res);
        this.loading = false;

        switch (res.role) {
          case 'DEMANDEUR':
            this.router.navigate(['/demandeur/dashboard']);
            break;
          case 'TECHNICIEN':
            this.router.navigate(['/technicien/dashboard']);
            break;
          case 'RESPONSABLE_MAINTENANCE':
            this.router.navigate(['/responsable/dashboard']);
            break;
          case 'SUPERVISEUR':
            this.router.navigate(['/superviseur/dashboard']);
            break;
          case 'ADMIN':
            this.router.navigate(['/admin/dashboard']);
            break;
          default:
            this.router.navigate(['/login']);
            break;
        }
      },
      error: (err: any) => {
        console.error('Erreur login : ', err);
        this.loading = false;
        this.errorMessage =
          err?.error || 'Échec de la connexion. Vérifiez vos identifiants.';
      },
    });
  }
}
