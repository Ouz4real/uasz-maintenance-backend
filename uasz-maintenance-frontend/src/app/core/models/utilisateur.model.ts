export interface UtilisateurApi {
  id: number;
  username: string;
  email: string;
  nom?: string | null;
  prenom?: string | null;
  departement?: string | null;
  serviceUnite?: string | null;
  telephone?: string | null;
  role?: string;
}
