// db/migrate.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'notifications.db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// _migrations 테이블 생성 (적용 여부 추적)
db.exec(`
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL
);
`);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

for (const file of files) {
  const already = db.prepare('SELECT 1 FROM _migrations WHERE name=?').get(file);
  if (already) continue;

  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
  console.log(`[migrate] applying ${file}...`);
  db.exec(sql);
  db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, datetime("now"))')
    .run(file);
}

console.log('[migrate] done.');
db.close();
