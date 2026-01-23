// Serviço para validar token de recuperação de senha no backend
export async function validateResetToken(token, email) {
  try {
    const apiBase = window.__API_BASE || '';
    const resp = await fetch(`${apiBase}/api/validate-reset-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email })
    });
    if (!resp.ok) return { valid: false, error: 'Token inválido ou expirado.' };
    const data = await resp.json();
    return { valid: !!data.valid, error: data.error || null };
  } catch (e) {
    return { valid: false, error: 'Erro ao validar token.' };
  }
}
