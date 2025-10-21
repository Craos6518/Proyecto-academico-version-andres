#!/usr/bin/env node
// Script para hashear contraseñas en la tabla `users` usando bcrypt y PostgreSQL
// Requisitos: exportar DATABASE_URL en el entorno y tener dependencias instaladas (pg, bcrypt)

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Error: define la variable de entorno DATABASE_URL con la conexión a Postgres');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    // Obtener usuarios con password en texto plano
    const { rows } = await client.query("SELECT id, username, email, password FROM users WHERE password IS NOT NULL AND password <> ''");
    console.log(`Found ${rows.length} users with plaintext password`);

    for (const row of rows) {
      const { id, username, email, password } = row;
      console.log(`Processing user id=${id} username=${username} email=${email}`);

      if (DRY_RUN) {
        console.log(`[dry-run] would hash password for user ${id}`);
        continue;
      }

      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, id]);
      console.log(`User ${id} hashed`);
    }

    console.log('All done. Verify data. If OK, consider dropping plaintext password column (see README).');
  } catch (err) {
    console.error('Error during hashing:', err);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
