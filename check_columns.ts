import { Database } from 'bun:sqlite';
import path from 'path';

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || '/tmp';
const ORACLE_DATA_DIR = process.env.ORACLE_DATA_DIR || path.join(HOME_DIR, '.oracle');
const DB_PATH = process.env.ORACLE_DB_PATH || path.join(ORACLE_DATA_DIR, 'oracle.db');

const db = new Database(DB_PATH);
const columns = db.query("PRAGMA table_info(__drizzle_migrations)").all();
console.log('Columns:', JSON.stringify(columns, null, 2));
db.close();
