// Serviço para validar token de recuperação de senha no backend
export async function validateResetToken(token) {
  try {
    const apiBase = window.__API_BASE || '';
    const resp = await fetch(`${apiBase}/api/validate-reset-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    if (!resp.ok) return { valid: false, error: 'Token inválido ou expirado.' };
    const data = await resp.json();
    return { valid: !!data.ok, error: data.error || null };
  } catch (e) {
    return { valid: false, error: 'Erro ao validar token.' };
  }
}

// Solicita geração de token de redefinição de senha no backend
export async function requestPasswordReset(email) {
  try {
    const apiBase = window.__API_BASE || '';
    const resp = await fetch(`${apiBase}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!resp.ok) return { ok: false, error: 'Email não encontrado ou erro ao solicitar redefinição.' };
    const data = await resp.json();
    return { ok: !!data.ok, token: data.token, expiresAt: data.expiresAt, error: data.error || null };
  } catch (e) {
    return { ok: false, error: 'Erro ao solicitar redefinição.' };
  }
}
