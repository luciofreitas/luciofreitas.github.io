// Ensure `process.env` exists in browser environments where some libs expect it
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
  // eslint-disable-next-line no-undef
  window.process = { env: {} };
}
// Also support globalThis
if (typeof globalThis !== 'undefined' && typeof globalThis.process === 'undefined') {
  globalThis.process = globalThis.process || { env: {} };
}

// Export nothing; file is imported for side-effects only
export {};
// Ensure `process.env` exists in browser environments where some libs expect it
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
  // eslint-disable-next-line no-undef
  window.process = { env: {} };
}
// Also support globalThis
if (typeof globalThis !== 'undefined' && typeof globalThis.process === 'undefined') {
  globalThis.process = globalThis.process || { env: {} };
}
