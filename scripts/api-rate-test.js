(async () => {
  const base = 'https://luciofreitas-github-io.onrender.com';
  const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
  try {
    console.log('Fetching guias list...');
    const res = await fetch(base + '/api/guias');
    if(!res.ok) throw new Error('Failed to fetch guias: ' + res.status);
    const guias = await res.json();
    if(!Array.isArray(guias) || guias.length === 0) {
      console.error('No guias found');
      process.exit(1);
    }
    const guia = guias[0];
    const id = guia.id;
    console.log('Using guia id=', id, 'title=', guia.titulo || guia.title || guia.id);

    const getGuia = async () => {
      const r = await fetch(`${base}/api/guias/${encodeURIComponent(id)}`);
      if(!r.ok) throw new Error('GET guia failed: ' + r.status);
      return await r.json();
    };

    const before = await getGuia();
    console.log('Before rating - guia summary ratings:', before.ratings ? before.ratings : JSON.stringify(before).slice(0,200));

    // Post a rating with a unique email so subsequent tests don't collide
    const uniqueEmail = `e2e+${Date.now()}@example.com`;
    const payload = { userEmail: uniqueEmail, rating: 5 };
    console.log('Posting rating with email', uniqueEmail);
    let post = await fetch(`${base}/api/guias/${encodeURIComponent(id)}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if(!post.ok) {
      console.warn('Path-based POST failed with', post.status, ', trying body-based POST fallback');
      post = await fetch(`${base}/api/guias/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guiaId: id, ...payload }),
      });
    }
    if(!post.ok) {
      const text = await post.text().catch(()=>'');
      throw new Error('POST rating failed: ' + post.status + ' ' + text);
    }
    console.log('POST rating response:', post.status);
    const after = await getGuia();
    console.log('After rating - guia summary ratings:', after.ratings ? after.ratings : JSON.stringify(after).slice(0,200));

    // Print useful fields if present
    const printRatings = (g, label) => {
      const r = g.ratings || {};
      console.log(label, 'total=', r.total || r.count || 'n/a', 'average=', r.average || r.avg || 'n/a');
    };
    printRatings(before, 'Before');
    printRatings(after, 'After');

    console.log('Test completed');
  } catch (e) {
    console.error('Error during API E2E test:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
