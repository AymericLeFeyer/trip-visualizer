import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const databasePath = resolve(process.env.DATABASE_PATH ?? './data/trips.db');

// S'assurer que le dossier de la bdd existe.
mkdirSync(dirname(databasePath), { recursive: true });

// SQLite embarqué dans Node (node:sqlite) — aucun module natif à compiler.
export const db = new DatabaseSync(databasePath);
db.exec('PRAGMA journal_mode = WAL;');

// Le voyage complet est stocké comme document JSON, indexé par id.
db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);
