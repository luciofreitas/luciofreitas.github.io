// Script para atualizar o ID do usuário para corresponder ao Firebase UID
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Client } = require("pg");

async function updateUserId() {
  const email = "luciodfp@gmail.com";
  const newId = "BpIVI83MOqfqEJdCgDKYSjDpNZr1"; // UID do Firebase
  
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
      [email]
    );
    
    if (currentUser.rowCount === 0) {
      console.log("❌ Usuário não encontrado!");
      return;
    }
    
    console.log("Usuário atual:");
    console.log("  ID:", currentUser.rows[0].id);
    console.log("  Email:", currentUser.rows[0].email);
    console.log("  Nome:", currentUser.rows[0].nome);
    console.log("  Celular:", currentUser.rows[0].celular);
    console.log();

    // Atualizar o ID
    console.log("🔄 Atualizando ID...");
    const result = await pgClient.query(
      "UPDATE users SET id = $1, atualizado_em = now() WHERE LOWER(email) = LOWER($2) RETURNING id, email, nome, celular",
      [newId, email]
    );

    if (result.rowCount === 0) {
      console.log("❌ Falha na atualização!");
    } else {
      console.log("✅ ID atualizado com sucesso!");
      console.log("Novo usuário:");
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

updateUserId();