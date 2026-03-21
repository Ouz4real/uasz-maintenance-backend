import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  token: string | null = null;
  loading = false;
  success = false;
  errorMessage: string | null = null;
  hidePassword = true;
  hideConfirm = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.errorMessage = 'Lien invalide. Veuillez refaire une demande de réinitialisation.';
    }
  }

  get passwordMismatch(): boolean {
    const p = this.form.get('password')?.value;
    const c = this.form.get('confirm')?.value;
    return !!c && p !== c;
  }

  onSubmit(): void {
    if (this.form.invalid || this.passwordMismatch || !this.token) return;

    this.loading = true;
    this.errorMessage = null;

    this.authService.resetPassword(this.token, this.form.value.password).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? err.error ?? 'Lien expiré ou invalide. Veuillez refaire une demande.';
      }
    });
  }
}
