// check-db.js
const { Client } = require('pg');

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('ERROR: DATABASE_URL not set');
    process.exit(2);
  }

  const client = new Client({
    connectionString: url,
    // aceitar self-signed quando necessário; remova em produção se tiver CA confiável
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('DB CONNECTION: OK');
    const r = await client.query('SELECT version() AS v');
    console.log('PG VERSION:', r.rows[0].v);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('DB CONNECTION: FAILED');
    console.error(err && err.message ? err.message : err);
    try { await client.end(); } catch(e){}
    process.exit(1);
  }
})();
