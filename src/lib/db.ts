import fs from 'fs';
import path from 'path';

/**
 * Simpel Persistence Layer (JSON Database)
 * ─────────────────────────────────────────────────────────────────────────────
 * Digunakan untuk menyimpan data pengguna dan konfigurasi sementara 
 * sebelum melakukan migrasi penuh ke PostgreSQL via NestJS backend.
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readUsers(): Record<string, { hash: string; role: string }> {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      // Default users if file doesn't exist
      return {
        admin:    { hash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", role: "admin" },
        operator: { hash: "06e55b633481f7bb072957eabcf110c972e86691c3cfedabe088024bffe42f23", role: "operator" },
        engineer: { hash: "7826b958b79c70626801b880405eb5111557dadceb2fee2b1ed69a18eed0c6dc", role: "engineer" },
      };
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read users DB:', e);
    return {};
  }
}

export function writeUsers(users: Record<string, { hash: string; role: string }>): boolean {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to write users DB:', e);
    return false;
  }
}
