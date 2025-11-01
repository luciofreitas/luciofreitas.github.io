import { startGoogleRedirect, handleRedirectResult } from './firebaseAuth';

function setMsg(t, s) {
  const title = document.getElementById('title');
  const msg = document.getElementById('msg');
  if (title) title.textContent = t || title.textContent;
  if (msg) msg.textContent = s || msg.textContent;
}

(async function main(){
  try {
    const params = new URLSearchParams(window.location.search || '');
    const shouldStart = params.get('start') === '1';
    const root = (window && window.location && window.location.origin) ? (window.location.origin + '/#/') : '/#/';

    if (shouldStart) {
      // Start the sign-in redirect from this lightweight entrypoint so the
      // provider returns here instead of the heavy app bundle.
      try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('__google_redirect_pending', '1'); } catch (e) {}
      setMsg('Abrindo Google...', 'Você será levado ao Google para selecionar a conta.');
      const started = await startGoogleRedirect();
      if (started && started.error) {
        console.error('auth-callback: failed to start redirect', started.error);
        try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem('__google_redirect_pending'); } catch (e) {}
        setMsg('Erro ao iniciar login', 'Voltando ao formulário de login...');
        setTimeout(() => { window.location.href = root + 'login?error=google_start'; }, 1400);
      }
      // signInWithRedirect will navigate away; nothing else to do here.
      return;
    }

    // Finalize the redirect result when provider returns here
    setMsg('Finalizando login...', 'Aguarde enquanto verificamos sua conta.');
    const res = await handleRedirectResult();
    try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem('__google_redirect_pending'); } catch (e) {}

    if (res && res.error) {
      console.warn('auth-callback: handleRedirectResult returned error', res.error);
      setMsg('Falha ao finalizar login', 'Voltando ao aplicativo...');
      setTimeout(() => { window.location.href = root + 'login?error=google_finish'; }, 900);
      return;
    }

    // Success (or no result). Redirect back to the app root where the app will
    // pick up auth state and continue (onAuthStateChanged / backend verify).
    setMsg('Login concluído', 'Redirecionando de volta para o aplicativo...');
    setTimeout(() => { window.location.href = root; }, 600);
  } catch (e) {
    console.error('auth-callback unexpected error', e && e.message ? e.message : e);
    try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem('__google_redirect_pending'); } catch (ee) {}
    setMsg('Erro inesperado', 'Voltando para a página inicial...');
    setTimeout(() => { window.location.href = '/#/login?error=google_unexpected'; }, 900);
  }
})();
