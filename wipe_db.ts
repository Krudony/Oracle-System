import fs from 'fs';
import path from 'path';

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || '/tmp';
const ORACLE_DATA_DIR = process.env.ORACLE_DATA_DIR || path.join(HOME_DIR, '.oracle');

const files = ['oracle.db', 'oracle.db-shm', 'oracle.db-wal', 'oracle.db.bak'];
files.forEach(f => {
  const p = path.join(ORACLE_DATA_DIR, f);
  if (fs.existsSync(p)) {
    console.log(`Deleting ${p}`);
    fs.unlinkSync(p);
  }
});
console.log('Done.');
