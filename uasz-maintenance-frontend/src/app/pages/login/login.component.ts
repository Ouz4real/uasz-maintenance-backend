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
import { FormsModule } from '@angular/forms';
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
    FormsModule,
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
  showForgotModal = false;
  forgotEmail = '';
  forgotLoading = false;
  forgotSent = false;
  forgotError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    const savedUsername = localStorage.getItem('rememberedUsername') ?? '';
    this.loginForm = this.fb.group({
      username: [savedUsername, Validators.required],
      password: ['', Validators.required],
      rememberMe: [!!savedUsername],
    });
  }

  openForgotModal(): void {
    this.showForgotModal = true;
    this.forgotEmail = '';
    this.forgotSent = false;
    this.forgotError = null;
  }

  closeForgotModal(): void { this.showForgotModal = false; }

  submitForgotPassword(): void {
    if (!this.forgotEmail) return;
    this.forgotLoading = true;
    this.forgotError = null;

    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.forgotSent = true;
      },
      error: () => {
        this.forgotLoading = false;
        this.forgotError = 'Une erreur est survenue. Veuillez réessayer.';
      }
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
      return;
    }

    const { username, password, rememberMe } = this.loginForm.value;

    if (rememberMe) {
      localStorage.setItem('rememberedUsername', username);
    } else {
      localStorage.removeItem('rememberedUsername');
    }

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
