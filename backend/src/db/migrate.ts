import fs from 'fs';
import path from 'path';
import pool from '../config/database';

async function migrate() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await pool.query(sql);
      }
    }
    console.log('✅ All migrations completed successfully.');
  } catch (error: any) {
    console.error('⚠️ Migration warning/error:', error.message || error);
  } finally {
    try {
      await pool.end();
    } catch {}
  }
}

migrate();
