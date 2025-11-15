// Script para corrigir email e ID do usuário
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Client } = require("pg");

async function fixUserData() {
  const oldEmail = "luciofp@gmail.com";  // Email atual no banco
  const correctEmail = "luciodfp@gmail.com";  // Email correto do Firebase  
  const firebaseUID = "BpIVI83MOqfqEJdCgDKYSjDpNZr1"; // UID do Firebase
  
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
    console.log("✅ Conectado ao PostgreSQL\n");

    // Verificar usuário atual
    console.log("📋 Verificando usuário atual...");
    const currentUser = await pgClient.query(
      "SELECT id, email, nome, celular FROM users WHERE LOWER(email) = LOWER($1)",
      [oldEmail]
    );
    
    if (currentUser.rowCount === 0) {
      console.log("❌ Usuário com email antigo não encontrado!");
      return;
    }
    
    console.log("Usuário atual (dados incorretos):");
    console.log("  ID:", currentUser.rows[0].id);
    console.log("  Email:", currentUser.rows[0].email);
    console.log("  Nome:", currentUser.rows[0].nome);
    console.log("  Celular:", currentUser.rows[0].celular);
    console.log();

    // Atualizar email E ID
    console.log("🔄 Corrigindo email e ID...");
    const result = await pgClient.query(
      "UPDATE users SET id = $1, email = $2, atualizado_em = now() WHERE LOWER(email) = LOWER($3) RETURNING id, email, nome, celular",
      [firebaseUID, correctEmail, oldEmail]
    );

    if (result.rowCount === 0) {
      console.log("❌ Falha na atualização!");
    } else {
      console.log("✅ Dados corrigidos com sucesso!");
      console.log("Usuário atualizado:");
      console.log("  ID:", result.rows[0].id);
      console.log("  Email:", result.rows[0].email);
      console.log("  Nome:", result.rows[0].nome);
      console.log("  Celular:", result.rows[0].celular);
    }

  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await pgClient.end();
  }
}

fixUserData();