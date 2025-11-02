// Script para monitorar o usuário em tempo real
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Client } = require("pg");

async function checkUserNow() {
  const email = "luciodfp@gmail.com";
  
  const connectionString = process.env.DATABASE_URL;
  const pgClient = new Client(connectionString ? {
    connectionString,
    ssl: { rejectUnauthorized: false }
  } : {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || "5432", 10),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pgClient.connect();
    console.log("✅ Conectado ao PostgreSQL");
    
    // Busca EXATAMENTE como o backend faz
    console.log("\n🔍 BUSCA EXATA COMO NO BACKEND:");
    console.log("Query: SELECT id, email, nome as name, photo_url, is_pro, criado_em, celular FROM users WHERE LOWER(email) = LOWER($1)");
    console.log("Param:", [email]);
    
    const result = await pgClient.query(`SELECT id, email, nome as name, photo_url, is_pro, criado_em, celular FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
    
    console.log("\n📊 RESULTADO:");
    console.log("Rows encontradas:", result.rowCount);
    
    if (result.rowCount > 0) {
      const user = result.rows[0];
      console.log("\n👤 DADOS DO USUÁRIO:");
      console.log("  ID:", user.id);
      console.log("  Email:", user.email);
      console.log("  Nome:", user.name);
      console.log("  Celular:", user.celular);
      console.log("  Photo URL:", user.photo_url);
      console.log("  Is Pro:", user.is_pro);
      console.log("  Criado em:", user.criado_em);
      
      // Verificar se celular é null/undefined/empty
      console.log("\n🔬 ANÁLISE DO CELULAR:");
      console.log("  Tipo:", typeof user.celular);
      console.log("  Valor:", JSON.stringify(user.celular));
      console.log("  É null?", user.celular === null);
      console.log("  É undefined?", user.celular === undefined);
      console.log("  É string vazia?", user.celular === "");
      
    } else {
      console.log("❌ USUÁRIO NÃO ENCONTRADO!");
    }

  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await pgClient.end();
  }
}

checkUserNow();