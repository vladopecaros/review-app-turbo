import pc from 'picocolors';
import { REGISTRY, type Style } from '../lib/registry.js';
import { readConfig, writeConfig } from '../lib/config.js';
import { copyComponent, registryExists } from '../lib/copy.js';
import { runInit } from './init.js';

export async function runAdd(componentName: string, styleFlag: string | undefined) {
  const cwd = process.cwd();

  // Validate component name
  const entry = REGISTRY[componentName];
  if (!entry) {
    const names = Object.keys(REGISTRY).join(', ');
    console.error(`${pc.red('error')} Unknown component "${componentName}". Available: ${names}`);
    process.exit(1);
  }

  // Ensure registry source exists (dev environment check)
  if (!(await registryExists())) {
    console.error(
      `${pc.red('error')} Component registry not found. Make sure @reviewlico/review-components is present.`,
    );
    process.exit(1);
  }

  // Load or create config
  let config = await readConfig(cwd);
  if (!config) {
    config = await runInit(cwd);
  }

  // Apply --styles override
  const style: Style = (styleFlag as Style | undefined) ?? config.style;
  if (style !== 'plain' && style !== 'tailwind') {
    console.error(`${pc.red('error')} Invalid style "${style}". Use "plain" or "tailwind".`);
    process.exit(1);
  }

  // Persist style change if flag was provided
  if (styleFlag && styleFlag !== config.style) {
    config.style = style;
    await writeConfig(cwd, config);
    console.log(`${pc.dim(`Updated style to "${style}" in reviewlico.config.json`)}`);
  }

  console.log(
    `\nAdding ${pc.cyan(componentName)} (${pc.bold(style)}) → ${pc.dim(config.outputDir)}\n`,
  );

  const { copied, skipped } = await copyComponent(entry, style, config.outputDir, cwd);

  console.log('');

  if (copied.length > 0) {
    console.log(`${pc.green('✓')} ${copied.length} file${copied.length !== 1 ? 's' : ''} added`);
  }
  if (skipped.length > 0) {
    console.log(`${pc.dim(`${skipped.length} file${skipped.length !== 1 ? 's' : ''} skipped (already exist)`)}`);
  }

  if (style === 'plain' && entry.cssFile && copied.includes(entry.cssFile)) {
    console.log(
      `\n${pc.yellow('Reminder:')} Import the CSS file once in your app:\n` +
        `  ${pc.dim(`import './${config.outputDir}/${entry.cssFile}';`)}`,
    );
  }

  console.log(
    `\nImport your component:\n` +
      `  ${pc.dim(`import { ${componentName} } from './${config.outputDir}/${componentName}';`)}\n`,
  );
}
