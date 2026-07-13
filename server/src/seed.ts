import bcrypt from 'bcryptjs';
import { pool } from './config/database';

async function seed() {
  const hash = await bcrypt.hash('admin123', 12);

  await pool.query(
    `INSERT INTO users (email, password_hash, name, role, is_active)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (email) DO NOTHING`,
    ['admin@test.com', hash, 'Admin', 'admin']
  );

  console.log('Admin user created: admin@test.com / admin123');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
