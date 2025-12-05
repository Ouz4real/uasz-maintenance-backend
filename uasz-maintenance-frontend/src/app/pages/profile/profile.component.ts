// src/app/pages/profile/profile.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import {
  UserProfile,
  UserProfileService,
  ChangePasswordRequest,
} from '../../core/services/user-profile.service';

@Component({
  standalone: true,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [CommonModule, FormsModule],
})
export class ProfileComponent implements OnInit {
  loadingProfile = false;
  savingProfile = false;
  changingPassword = false;

  loadError: string | null = null;
  saveSuccess: string | null = null;
  saveError: string | null = null;
  pwdSuccess: string | null = null;
  pwdError: string | null = null;

  profile: UserProfile | null = null;

  // modèle utilisé pour le formulaire (copie éditable)
  editableProfile: Partial<UserProfile> = {};

  // champs mot de passe
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  constructor(
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loadingProfile = true;
    this.loadError = null;

    this.userProfileService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.editableProfile = { ...profile };
        this.loadingProfile = false;
      },
      error: (err) => {
        console.error('Erreur chargement profil', err);
        this.loadingProfile = false;
        this.loadError =
          "Impossible de charger votre profil pour le moment. Vérifiez que l'API /me est bien disponible.";

        // Fallback minimal basé sur les infos AuthService
        const username = this.authService.getUsername() ?? 'Utilisateur';
        const role = this.authService.getRole() ?? 'ROLE_INCONNU';

        this.profile = {
          id: 0,
          nom: username,
          prenom: '',
          email: '',
          role,
        };

        this.editableProfile = { ...this.profile };
      },
    });
  }

  /** Enregistre les modifications de profil */
  saveProfile(): void {
    if (!this.editableProfile) {
      return;
    }

    this.savingProfile = true;
    this.saveSuccess = null;
    this.saveError = null;

    this.userProfileService.updateMyProfile(this.editableProfile).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.editableProfile = { ...updated };
        this.savingProfile = false;
        this.saveSuccess = 'Profil mis à jour avec succès.';
      },
      error: (err) => {
        console.error('Erreur mise à jour profil', err);
        this.savingProfile = false;
        this.saveError =
          'Une erreur est survenue lors de la mise à jour du profil.';
      },
    });
  }

  /** Réinitialise le formulaire aux valeurs actuelles du profil */
  resetProfileForm(): void {
    if (this.profile) {
      this.editableProfile = { ...this.profile };
      this.saveSuccess = null;
      this.saveError = null;
    }
  }

  /** Change le mot de passe */
  changePassword(): void {
    this.pwdSuccess = null;
    this.pwdError = null;

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.pwdError = 'Tous les champs mot de passe sont obligatoires.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.pwdError =
        'Le nouveau mot de passe doit contenir au moins 8 caractères.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.pwdError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    const payload: ChangePasswordRequest = {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    };

    this.changingPassword = true;

    this.userProfileService.changePassword(payload).subscribe({
      next: () => {
        this.changingPassword = false;
        this.pwdSuccess = 'Mot de passe modifié avec succès.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        console.error('Erreur changement mot de passe', err);
        this.changingPassword = false;
        this.pwdError =
          'Impossible de modifier le mot de passe. Vérifiez le mot de passe actuel ou contactez le support.';
      },
    });
  }

  /** Retour au dashboard selon le rôle courant */
  goBackToDashboard(): void {
    const role = this.authService.getRole();
    if (role) {
      this.authService.redirectUserByRole(role);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
