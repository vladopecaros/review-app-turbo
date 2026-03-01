import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export type Framework = 'next' | 'vite' | 'cra' | 'unknown';

export interface ProjectDetection {
  framework: Framework;
  hasTailwind: boolean;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

async function readPackageJson(cwd: string): Promise<PackageJson | null> {
  try {
    const raw = await readFile(join(cwd, 'package.json'), 'utf-8');
    return JSON.parse(raw) as PackageJson;
  } catch {
    return null;
  }
}

function hasDependency(pkg: PackageJson | null, name: string): boolean {
  if (!pkg) return false;
  return Boolean(pkg.dependencies?.[name] || pkg.devDependencies?.[name]);
}

function detectFramework(pkg: PackageJson | null): Framework {
  if (hasDependency(pkg, 'next')) return 'next';
  if (hasDependency(pkg, 'vite') || hasDependency(pkg, '@vitejs/plugin-react')) return 'vite';
  if (hasDependency(pkg, 'react-scripts')) return 'cra';
  return 'unknown';
}

function detectTailwind(cwd: string, pkg: PackageJson | null): boolean {
  if (hasDependency(pkg, 'tailwindcss')) return true;
  const configFiles = [
    'tailwind.config.js',
    'tailwind.config.cjs',
    'tailwind.config.mjs',
    'tailwind.config.ts',
  ];
  return configFiles.some((file) => existsSync(join(cwd, file)));
}

export async function detectProject(cwd: string): Promise<ProjectDetection> {
  const pkg = await readPackageJson(cwd);
  return {
    framework: detectFramework(pkg),
    hasTailwind: detectTailwind(cwd, pkg),
  };
}
