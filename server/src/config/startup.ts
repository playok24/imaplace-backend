import { pool } from './database';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

async function migrate() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const { rows } = await pool.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
    if (rows.length > 0) {
      console.log(`Skipping ${file} (already executed)`);
      continue;
    }
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
    console.log(`  ✓ ${file}`);
  }
  console.log('Migrations complete.');
}

async function seed() {
  const hash = await bcrypt.hash('admin123', 12);
  await pool.query(
    `INSERT INTO users (email, password_hash, name, role, is_active)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (email) DO NOTHING`,
    ['admin@test.com', hash, 'Admin', 'admin']
  );
  console.log('Admin user ready: admin@test.com / admin123');
}

export async function startup() {
  console.log('Running startup tasks...');
  await migrate();
  await seed();
  console.log('Startup complete.');
}
