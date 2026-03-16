import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  formData = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    departement: '',
    serviceUnite: '',
    username: '',
    motDePasse: ''
  };

  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    // Préparer les données pour l'API
    const registerData = {
      ...this.formData,
      role: 'DEMANDEUR' // Par défaut, les nouveaux utilisateurs sont des demandeurs
    };

    // Appel API pour l'inscription
    this.http.post(environment.apiUrl + '/auth/register', registerData, { responseType: 'text' })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Compte créé avec succès! Redirection vers la page de connexion...';
          
          // Rediriger vers la page de connexion après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          
          // Afficher le message d'erreur du backend
          if (error.error && typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else if (error.status === 409) {
            this.errorMessage = 'Ce nom d\'utilisateur ou cet email existe déjà';
          } else if (error.status === 400) {
            this.errorMessage = 'Données invalides. Veuillez vérifier vos informations';
          } else {
            this.errorMessage = 'Une erreur est survenue. Veuillez réessayer';
          }
          
          console.error('Erreur d\'inscription:', error);
        }
      });
  }
}
