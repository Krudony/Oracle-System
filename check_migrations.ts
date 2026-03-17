import { Database } from 'bun:sqlite';
import path from 'path';

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || '/tmp';
const ORACLE_DATA_DIR = process.env.ORACLE_DATA_DIR || path.join(HOME_DIR, '.oracle');
const DB_PATH = process.env.ORACLE_DB_PATH || path.join(ORACLE_DATA_DIR, 'oracle.db');

const db = new Database(DB_PATH);
try {
  const migrations = db.query("SELECT * FROM __drizzle_migrations").all();
  console.log('Migrations in DB:', JSON.stringify(migrations, null, 2));
} catch (e) {
  console.error('Error querying migrations:', e.message);
}
db.close();
