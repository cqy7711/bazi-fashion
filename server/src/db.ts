import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', '..', 'data', 'bazi.db');

// 确保 data 目录存在
import fs from 'fs';
const dataDir = path.join(__dirname, '..', '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// 初始化表
db.exec(`
  CREATE TABLE IF NOT EXISTS user_birth_info (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT DEFAULT '我的生辰',
    birth_year INTEGER NOT NULL,
    birth_month INTEGER NOT NULL,
    birth_day INTEGER NOT NULL,
    birth_hour INTEGER NOT NULL,
    gender TEXT NOT NULL,
    calendar_type TEXT NOT NULL,
    language_style TEXT DEFAULT 'normal',
    birth_location TEXT,
    bazi_result TEXT,
    five_elements TEXT,
    favorable_elements TEXT,
    unfavorable_elements TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_consumption (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    remaining INTEGER NOT NULL DEFAULT 1,
    order_id TEXT,
    valid_until TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
export { uuidv4 };
