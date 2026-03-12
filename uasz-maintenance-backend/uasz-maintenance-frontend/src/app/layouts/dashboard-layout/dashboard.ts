import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  // ⚠️ ICI : on pointe sur dashboard.html (ton vrai fichier)
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardLayoutComponent {

  // on déclare juste la variable, sans appeler authService ici
  user: any = null;

  constructor(private authService: AuthService) {
    // 👉 ici l’injection est faite, on peut appeler le service
    this.user = this.authService.getCurrentUser();
  }

  get userInitials(): string {
    if (!this.user || !this.user.username) return '?';
    return this.user.username.charAt(0).toUpperCase();
  }

  get userDisplayName(): string {
    return this.user?.username ?? '';
  }

  get userRoleLabel(): string {
    return this.user?.role ?? '';
  }

  logout() {
    this.authService.logout();
  }

  navItems = [
    { label: 'Tableau de bord',         icon: '📊', path: '/dashboard' },
    { label: 'Pannes & interventions',  icon: '🛠️', path: '/interventions' },
    { label: 'Équipements',             icon: '💻', path: '/equipements' },
  ];

  isActive(item: any) {
    return window.location.pathname === item.path;
  }
}
