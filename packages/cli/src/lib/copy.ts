import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import pc from 'picocolors';
import type { RegistryEntry, Style } from './registry.js';
import { ConfigError } from './config.js';

// dist/index.js lives in packages/cli/dist/
// dist/registry/ is the bundled copy of packages/review-components/ (copied by tsup onSuccess)
const __filename = fileURLToPath(import.meta.url);
const REGISTRY_ROOT = join(dirname(__filename), 'registry');

export interface CopyResult {
  copied: string[];
  overwritten: string[];
  skipped: string[];
}

export type OverwritePolicy = 'overwrite' | 'prompt' | 'skip';

function isSafeRegistryPath(file: string): boolean {
  if (isAbsolute(file)) return false;
  return !file.split(/[\\/]/).includes('..');
}

export async function copyComponent(
  entry: RegistryEntry,
  style: Style,
  outputDir: string,
  cwd: string,
  overwritePolicy: OverwritePolicy = 'overwrite',
): Promise<CopyResult> {
  // Guard: outputDir must stay within the project root (cwd)
  const resolvedOutput = resolve(cwd, outputDir);
  const rel = relative(resolve(cwd), resolvedOutput);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new ConfigError(
      `outputDir "${outputDir}" must be within the project root. Update reviewlico.config.json.`,
    );
  }

  // Guard: registry file paths must not escape the registry directory
  const allFiles = [...entry.variantFiles, ...entry.sharedFiles];
  if (entry.cssFile) allFiles.push(entry.cssFile);
  for (const file of allFiles) {
    if (!isSafeRegistryPath(file)) {
      throw new ConfigError(`Invalid registry file path: "${file}"`);
    }
  }

  const copied: string[] = [];
  const overwritten: string[] = [];
  const skipped: string[] = [];

  // Build list of { src, dest } pairs
  const filePairs: Array<{ src: string; dest: string; transformSharedImports?: boolean }> = [];

  for (const file of entry.variantFiles) {
    filePairs.push({
      src: join(REGISTRY_ROOT, 'registry', style, file),
      dest: join(resolvedOutput, file),
      transformSharedImports: file.endsWith('.ts') || file.endsWith('.tsx'),
    });
  }

  for (const file of entry.sharedFiles) {
    filePairs.push({
      src: join(REGISTRY_ROOT, 'shared', file),
      dest: join(resolvedOutput, file),
    });
  }

  if (style === 'plain' && entry.cssFile) {
    filePairs.push({
      src: join(REGISTRY_ROOT, 'registry', 'plain', entry.cssFile),
      dest: join(resolvedOutput, entry.cssFile),
    });
  }

  for (const { src, dest, transformSharedImports } of filePairs) {
    const fileName = relative(resolvedOutput, dest);

    const exists = existsSync(dest);
    if (exists) {
      if (overwritePolicy === 'skip') {
        console.log(`  ${pc.dim('skip')}  ${fileName}`);
        skipped.push(fileName);
        continue;
      }
      if (overwritePolicy === 'prompt') {
        const { overwrite } = await prompts({
          type: 'confirm',
          name: 'overwrite',
          message: `${pc.yellow(fileName)} already exists. Overwrite?`,
          initial: false,
        });

        if (!overwrite) {
          console.log(`  ${pc.dim('skip')}  ${fileName}`);
          skipped.push(fileName);
          continue;
        }
      }
    }

    await mkdir(dirname(dest), { recursive: true });
    if (transformSharedImports) {
      const contents = await readFile(src, 'utf-8');
      const updated = contents.replace(/\.\.\/\.\.\/shared\//g, './');
      await writeFile(dest, updated, 'utf-8');
    } else {
      await copyFile(src, dest);
    }
    if (exists) {
      console.log(`  ${pc.yellow('overwrite')}  ${fileName}`);
      overwritten.push(fileName);
    } else {
      console.log(`  ${pc.green('copy')}  ${fileName}`);
      copied.push(fileName);
    }
  }

  return { copied, overwritten, skipped };
}

export async function registryExists(): Promise<boolean> {
  try {
    await readdir(REGISTRY_ROOT);
    return true;
  } catch {
    return false;
  }
}
