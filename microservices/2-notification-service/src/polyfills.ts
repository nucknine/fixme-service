// Polyfill for Node.js 18 compatibility with email-templates/undici
if (typeof globalThis.File === 'undefined') {
  (globalThis as any).File = class {};
}
