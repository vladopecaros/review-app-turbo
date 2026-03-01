import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Style } from './registry.js';

export const CONFIG_FILE = 'reviewlico.config.json';

export interface ReviewlicoConfig {
  outputDir: string;
  style: Style;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export async function readConfig(cwd: string): Promise<ReviewlicoConfig | null> {
  const filePath = join(cwd, CONFIG_FILE);
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null; // normal first-run
    throw err; // permission error or other unexpected failure — rethrow
  }
  try {
    return JSON.parse(raw) as ReviewlicoConfig;
  } catch {
    throw new ConfigError(
      `${CONFIG_FILE} contains invalid JSON. Fix it or delete it to re-initialize.`,
    );
  }
}

export async function writeConfig(cwd: string, config: ReviewlicoConfig): Promise<void> {
  await writeFile(join(cwd, CONFIG_FILE), JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
