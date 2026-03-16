import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-change-password-required',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password-required.component.html',
  styleUrls: ['./change-password-required.component.scss']
})
export class ChangePasswordRequiredComponent implements OnInit {
  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  isSubmitting = false;
  userId: number | null = null;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Récupérer l'ID utilisateur depuis localStorage
    const userIdStr = localStorage.getItem('auth_userId');
    if (userIdStr) {
      this.userId = parseInt(userIdStr, 10);
    } else {
      // Si pas d'ID, rediriger vers login
      this.router.navigate(['/login']);
    }
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';

    // Validation
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (!this.userId) {
      this.errorMessage = 'Session invalide. Veuillez vous reconnecter';
      return;
    }

    this.isSubmitting = true;

    const request = {
      userId: this.userId,
      newPassword: this.newPassword
    };

    this.http.post(environment.apiUrl + '/auth/change-password-required', request, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          // Rediriger vers le dashboard approprié selon le rôle
          const role = localStorage.getItem('auth_role');
          this.redirectToDashboard(role);
        },
        error: (error) => {
          this.isSubmitting = false;
          if (error.status === 400) {
            this.errorMessage = 'Données invalides. Veuillez vérifier vos informations';
          } else {
            this.errorMessage = 'Une erreur est survenue. Veuillez réessayer';
          }
          console.error('Erreur changement mot de passe:', error);
        }
      });
  }

  private redirectToDashboard(role: string | null): void {
    switch (role) {
      case 'DEMANDEUR':
        this.router.navigate(['/dashboard-demandeur']);
        break;
      case 'TECHNICIEN':
        this.router.navigate(['/dashboard-technicien']);
        break;
      case 'RESPONSABLE_MAINTENANCE':
        this.router.navigate(['/dashboard-responsable']);
        break;
      case 'SUPERVISEUR':
        this.router.navigate(['/dashboard-superviseur']);
        break;
      case 'ADMINISTRATEUR':
        this.router.navigate(['/dashboard-admin']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
