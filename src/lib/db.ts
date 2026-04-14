import fs from 'fs';
import path from 'path';

/**
 * Persistensi JSON Fail-Safe (Vercel Compatible)
 * ─────────────────────────────────────────────────────────────────────────────
 * Menangani penyimpanan data pengguna dengan fallback ke memori jika folder 
 * 'data' tidak dapat dibaca atau ditulis (terjadi di lingkungan Vercel).
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// In-memory fallback untuk lingkungan serverless (Vercel)
let memoryUsers: Record<string, { hash: string; role: string }> | null = null;

const DEFAULT_USERS = {
  admin:    { hash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", role: "admin" },
  operator: { hash: "06e55b633481f7bb072957eabcf110c972e86691c3cfedabe088024bffe42f23", role: "operator" },
  engineer: { hash: "7826b958b79c70626801b880405eb5111557dadceb2fee2b1ed69a18eed0c6dc", role: "engineer" },
};

export function readUsers(): Record<string, { hash: string; role: string }> {
  // Jika sudah ada di memori, gunakan memori (lebih cepat pada Vercel)
  if (memoryUsers) return memoryUsers;

  try {
    if (!fs.existsSync(USERS_FILE)) {
      return DEFAULT_USERS;
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    memoryUsers = JSON.parse(data);
    return memoryUsers || DEFAULT_USERS;
  } catch (e) {
    console.warn('[DB] Read failed, using defaults (Normal on Vercel):', e instanceof Error ? e.message : 'Unknown');
    return DEFAULT_USERS;
  }
}

export function writeUsers(users: Record<string, { hash: string; role: string }>): boolean {
  // Selalu update memori agar sesi saat ini tetap sinkron
  memoryUsers = users;

  try {
    // Pastikan direktori ada sebelum menulis (hanya di local development)
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (e) {
    // Log warning saja, jangan biarkan aplikasi crash
    console.warn('[DB] Write failed, falling back to memory (Expected on Vercel):', e instanceof Error ? e.message : 'Unknown');
    return false;
  }
}
