export interface Demande {
  id: number;
  titre: string;
  description?: string;

  demandeurNom: string;
  lieu?: string;
  typeEquipement?: string;

  dateCreation: Date;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE' | 'ANNULEE';
  statutInterventions?: 'NON_DEMARREE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

  urgenceDemandeur?: 'BASSE' | 'MOYENNE' | 'HAUTE' | null;
  urgenceResponsable: 'BASSE' | 'MOYENNE' | 'HAUTE' | null;

  technicienId?: number | null;
  technicienNom?: string | null;
  commentaireInterne?: string | null;

  // Champs pour le déclin
  raisonRefus?: string | null;
  dateRefus?: string | null;
  technicienDeclinantId?: number | null;
  technicienDeclinantNom?: string | null;

  imageUrl?: string | null;
  imageResolutionUrl?: string | null;
}

