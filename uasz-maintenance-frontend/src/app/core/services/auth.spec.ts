import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { WebSocketService } from './websocket.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockWebSocketService = {
    connect: jasmine.createSpy('connect'),
    disconnect: jasmine.createSpy('disconnect'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: WebSocketService, useValue: mockWebSocketService }
      ],
    });
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });

  it('isAuthenticated doit retourner false si pas de token', () => {
    localStorage.removeItem('auth_token');
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('isAuthenticated doit retourner true si token présent', () => {
    localStorage.setItem('auth_token', 'fake-token');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('getRole doit retourner null si pas de rôle', () => {
    localStorage.removeItem('auth_role');
    expect(service.getRole()).toBeNull();
  });

  it('getRole doit retourner le rôle stocké', () => {
    localStorage.setItem('auth_role', 'DEMANDEUR');
    expect(service.getRole()).toBe('DEMANDEUR');
  });

  it('getToken doit retourner null si pas de token', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getFullName doit retourner prénom + nom', () => {
    localStorage.setItem('auth_prenom', 'Ousmane');
    localStorage.setItem('auth_nom', 'Mané');
    expect(service.getFullName()).toContain('Ousmane');
    expect(service.getFullName()).toContain('Mané');
  });

  it('getUserId doit retourner null si pas d\'ID', () => {
    localStorage.removeItem('auth_userId');
    expect(service.getUserId()).toBeNull();
  });

  it('mustChangePassword doit retourner false par défaut', () => {
    localStorage.removeItem('auth_mustChangePassword');
    expect(service.mustChangePassword()).toBeFalse();
  });
});
