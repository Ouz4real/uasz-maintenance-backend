// src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

type DemandeStatut = 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE';

interface Demande {
  id: number;
  titre: string;
  dateCreation: Date;
  statut: DemandeStatut;

  lieu: string;
  typeEquipement: string;
  description: string;
  imageFileName?: string;
  imageUrl?: string;
}

interface NouvelleDemandeForm {
  titre: string;
  lieu: string;
  typeEquipement: string;
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
}

@Component({
  selector: 'app-dashboard-demandeur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-demandeur.component.html',
  styleUrls: ['./dashboard-demandeur.component.scss'],
})
export class DashboardDemandeurComponent implements OnInit {
  username = 'Demandeur';
  usernameInitial = 'D';

  userMenuOpen = false;

  activeItem: 'dashboard' | 'mes-demandes' | 'documents' | 'aide' = 'dashboard';

  demandes: Demande[] = [];

  enAttente = 0;
  enCours = 0;
  resolues = 0;

  /* ----- MODAL NOUVELLE DEMANDE ----- */
  showNewDemandeModal = false;

  newDemande: NouvelleDemandeForm = {
    titre: '',
    lieu: '',
    typeEquipement: '',
    description: '',
    imageFile: null,
    imagePreview: null,
  };

  /* ----- MODAL DÉTAILS ----- */
  showDetailsModal = false;
  selectedDemande: Demande | null = null;
  showImageInDetails = false;

  /* ----- TOAST DE SUCCÈS ----- */
  showSuccessToast = false;
  successMessage = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    const storedUsername = localStorage.getItem('auth_username');
    if (storedUsername) {
      this.username = storedUsername;
      this.usernameInitial = storedUsername.charAt(0).toUpperCase();
    }

    // 💡 Exemples de demandes : en attente, en cours, résolue
    this.demandes = [
      {
        id: 1,
        titre: 'PC salle INFO-101 – écran noir',
        dateCreation: new Date('2025-11-28T09:15:00'),
        statut: 'EN_ATTENTE',
        lieu: 'Salle INFO-101',
        typeEquipement: 'Ordinateur de bureau',
        description: 'Le PC ne démarre plus, aucun affichage à l’écran.',
      },
      {
        id: 2,
        titre: 'Imprimante BIBLIO – bourrage papier',
        dateCreation: new Date('2025-11-27T14:30:00'),
        statut: 'EN_COURS',
        lieu: 'Bibliothèque centrale – Rez-de-chaussée',
        typeEquipement: 'Imprimante réseau',
        description:
          'L’imprimante affiche “bourrage papier” en permanence. Impossible d’imprimer les fiches d’emprunt.',
      },
      {
        id: 3,
        titre: 'Vidéoprojecteur Amphi B – lampe à remplacer',
        dateCreation: new Date('2025-11-25T08:00:00'),
        statut: 'RESOLUE',
        lieu: 'Amphi B',
        typeEquipement: 'Vidéoprojecteur',
        description:
          'L’image était très faible et jaunâtre. La lampe a été remplacée, fonctionnement normal.',
      },
    ];

    this.computeStats();
  }

  computeStats(): void {
    this.enAttente = this.demandes.filter(d => d.statut === 'EN_ATTENTE').length;
    this.enCours = this.demandes.filter(d => d.statut === 'EN_COURS').length;
    this.resolues = this.demandes.filter(d => d.statut === 'RESOLUE').length;
  }

  setActive(item: 'dashboard' | 'mes-demandes' | 'documents' | 'aide'): void {
    this.activeItem = item;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  goToDashboard(): void {
    this.activeItem = 'dashboard';
    this.userMenuOpen = false;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_role');
    this.router.navigate(['/login']);
  }

  /* ----- MODAL NOUVELLE DEMANDE ----- */
  openNewDemandeModal(): void {
    this.showNewDemandeModal = true;
  }

  closeNewDemandeModal(): void {
    this.showNewDemandeModal = false;
    this.newDemande = {
      titre: '',
      lieu: '',
      typeEquipement: '',
      description: '',
      imageFile: null,
      imagePreview: null,
    };
  }

  /* --- GESTION IMAGE --- */
  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.newDemande.imageFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.newDemande.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // bouton ✕
  removeSelectedImage(): void {
    this.newDemande.imageFile = null;
    this.newDemande.imagePreview = null;

    // on nettoie aussi le champ <input type="file">
    const fileInput = document.getElementById('image') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /* ----- SOUMISSION NOUVELLE DEMANDE ----- */
  submitNewDemande(): void {
    if (!this.newDemande.titre || !this.newDemande.lieu) {
      return;
    }

    const created: Demande = {
      id: this.demandes.length + 1,
      titre: this.newDemande.titre,
      dateCreation: new Date(),
      statut: 'EN_ATTENTE',
      lieu: this.newDemande.lieu,
      typeEquipement: this.newDemande.typeEquipement,
      description: this.newDemande.description,
      imageUrl: this.newDemande.imagePreview || undefined,
    };

    this.demandes.unshift(created);
    this.computeStats();

    this.closeNewDemandeModal();

    this.successMessage =
      'Votre demande a été créée avec succès ! Notre équipe technique va l’examiner et la prendre en charge sous peu.';
    this.showSuccessToast = true;

    setTimeout(() => {
      this.showSuccessToast = false;
    }, 5000);
  }

  /* ----- DETAILS ----- */

  openDemandeDetails(d: Demande): void {
    this.selectedDemande = d;
    this.showDetailsModal = true;
    this.showImageInDetails = false;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedDemande = null;
  }

  getStatutLabel(s: DemandeStatut): string {
    return s === 'EN_ATTENTE'
      ? 'En attente'
      : s === 'EN_COURS'
        ? 'En cours'
        : 'Résolue';
  }
}
