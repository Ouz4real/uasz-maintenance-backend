// src/app/core/models/auth.models.ts
export interface AuthRequest {
  usernameOrEmail: string;
  motDePasse: string;
}

export type Role = 'ADMIN' | 'TECHNICIEN' | 'DEMANDEUR' | 'RESPONSABLE' | string;

export interface AuthResponse {
  token: string;
  type: string;      // "Bearer"
  userId: number;
  username: string;
  email: string;
  role: Role;
}

export interface UtilisateurResponse {
  id: number;
  username: string;
  email: string;
  role: Role;
  enabled: boolean;
}
