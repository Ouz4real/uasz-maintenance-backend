// Polyfill pour sockjs-client qui utilise 'global' (Node.js) dans le navigateur
(window as any).global = window;

// Mock sockjs-client pour les tests
(window as any).SockJS = class MockSockJS {
  constructor(_url: string) {}
  close() {}
  send(_data: string) {}
  onopen: (() => void) | null = null;
  onmessage: ((e: any) => void) | null = null;
  onclose: (() => void) | null = null;
};
