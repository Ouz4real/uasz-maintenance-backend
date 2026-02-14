export type StatutPreventive = 'PLANIFIEE' | 'EN_RETARD' | 'REALISEE' | 'ANNULEE';

export interface MaintenancePreventive {
  id: number;

  equipementReference: string;

  // ✅ optionnel si tu veux encore afficher une colonne "Type"
  typeEquipement?: string | null;

  technicienId: number | null;
  technicienNom?: string | null;

  frequence: string;
  prochaineDate: string;

  responsable: string;
  statut: StatutPreventive;

  description: string;
  
  // Champs de réalisation
  dateRealisee?: string | null;
  rapport?: string | null;
  piecesUtilisees?: string | null;
  photoUrl?: string | null;
}
