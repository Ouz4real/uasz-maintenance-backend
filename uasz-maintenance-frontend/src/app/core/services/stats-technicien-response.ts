export interface StatsTechnicienResponse {
  technicienId: number;
  technicienUsername?: string;
  technicienEmail?: string;

  totalInterventions: number;

  interventionsPlanifiees: number;
  interventionsEnCours: number;
  interventionsTerminees: number;
  interventionsAnnulees: number;

  tempsMoyenMinutes: number | null;
  tempsMoyenAffichage: string; // ex: "1 h 30 min"
}
