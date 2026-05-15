import { app } from 'electron';
import Store from 'electron-store';
import * as fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const userData = app.getPath('userData');
const keyFile = path.join(userData, 'store_key');

function ensureUserData() {
  try {
    fs.mkdirSync(userData, { recursive: true });
  } catch {
    // ignore
  }
}

function getEncryptionKey(): string {
  ensureUserData();

  try {
    if (fs.existsSync(keyFile)) {
      return fs.readFileSync(keyFile, 'utf8');
    }
  } catch {
    // fallthrough to generate
  }

  const key = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(keyFile, key, { mode: 0o600 });
  } catch {
    // best-effort
  }
  return key;
}

const store = new Store({ name: 'uiterm-config', encryptionKey: getEncryptionKey() });

export type AppConfig = {
  provider?: string;
  apiKey?: string;
  model?: string;
  [k: string]: any;
};

export function loadConfig(): AppConfig {
  return (store.get('app') as AppConfig) ?? {};
}

export function saveConfig(partial: Partial<AppConfig>): AppConfig {
  const current = loadConfig() || {};
  const next = { ...current, ...partial };
  store.set('app', next);
  return next;
}

function parseDotEnv(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    const quote = value[0];

    if ((quote === `"` || quote === "'") && value.endsWith(quote)) {
      value = value.slice(1, -1);
    }

    if (key) values[key] = quote === `"` ? value.replaceAll('\\n', '\n') : value;
  }

  return values;
}

export async function migrateFromDotEnv(): Promise<void> {
  const candidates = [path.join(process.cwd(), '.env'), path.join(__dirname, '../../.env')];
  const envPath = candidates.find(p => fs.existsSync(p));
  if (!envPath) return;

  try {
    const contents = fs.readFileSync(envPath, 'utf8');
    const parsed = parseDotEnv(contents);
    const cfg = loadConfig();
    if (parsed.OPENAI_API_KEY && !cfg.apiKey) {
      saveConfig({ apiKey: parsed.OPENAI_API_KEY, model: parsed.OPENAI_MODEL });
    }

    try {
      fs.unlinkSync(envPath);
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
}
