// src/app/pages/login/login.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';

import {
  AuthService,
  LoginRequest,
} from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  hidePassword = true;
  loginForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  showDisabledAccountModal = false;
  disabledAccountMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  closeDisabledAccountModal(): void {
    this.showDisabledAccountModal = false;
    this.disabledAccountMessage = '';
  }

  onSubmit(): void {
    console.log('➡️ onSubmit()', this.loginForm.value);

    this.errorMessage = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.loginForm.value;
    const payload: LoginRequest = {
      usernameOrEmail: username,
      motDePasse: password,
    };

    this.loading = true;

    this.authService.login(payload).subscribe({
      next: (res) => {
        console.log('✅ Login réussi côté front :', res);
        this.loading = false;

        // Ici, res.role peut être "ADMINISTRATEUR" ou autre,
        // mais redirectUserByRole s’occupe de tout normaliser.
        console.log('➡️ Rôle détecté (depuis backend) :', res.role);
        this.authService.redirectUserByRole(res.role);
      },

      error: (err: HttpErrorResponse) => {
        this.loading = false;
        console.error('❌ Erreur login →', err);
        console.log('err.error =', err.error);
        console.log('err.status =', err.status);

        if (err.status === 401) {
          this.errorMessage = 'Identifiants incorrects';
        } else if (err.status === 403) {
          // Compte désactivé - afficher la modale
          this.disabledAccountMessage = typeof err.error === 'string' 
            ? err.error 
            : 'Votre compte a été désactivé. Veuillez contacter l\'administrateur pour plus d\'informations.';
          this.showDisabledAccountModal = true;
        } else {
          this.errorMessage =
            "Une erreur interne est survenue. Veuillez réessayer.";
        }
      },
    });
  }
}
