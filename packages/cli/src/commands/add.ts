import pc from 'picocolors';
import { REGISTRY, type Style } from '../lib/registry.js';
import { readConfig, writeConfig } from '../lib/config.js';
import { copyComponent, registryExists, type OverwritePolicy } from '../lib/copy.js';
import { runInit } from './init.js';
import { detectProject } from '../lib/detect.js';

export async function runAdd(
  componentName: string,
  styleFlag: string | undefined,
  options: { confirm?: boolean; skipExisting?: boolean },
) {
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

  if (options.confirm && options.skipExisting) {
    console.error(`${pc.red('error')} Use only one of --confirm or --skip-existing.`);
    process.exit(1);
  }

  const overwritePolicy: OverwritePolicy = options.confirm
    ? 'prompt'
    : options.skipExisting
      ? 'skip'
      : 'overwrite';

  const detection = await detectProject(cwd);
  const frameworkLabel =
    detection.framework === 'next'
      ? 'Next.js'
      : detection.framework === 'vite'
        ? 'Vite'
        : detection.framework === 'cra'
          ? 'Create React App'
          : 'Unknown';
  const overwriteLabel =
    overwritePolicy === 'prompt' ? 'prompt' : overwritePolicy === 'skip' ? 'skip' : 'overwrite';

  console.log(
    `\nAdding ${pc.cyan(componentName)} (${pc.bold(style)}) → ${pc.dim(config.outputDir)}\n`,
  );
  console.log(pc.dim(`Framework: ${frameworkLabel}`));
  console.log(pc.dim(`Tailwind detected: ${detection.hasTailwind ? 'yes' : 'no'}`));
  console.log(pc.dim(`Overwrite policy: ${overwriteLabel}`));

  const { copied, overwritten, skipped } = await copyComponent(
    entry,
    style,
    config.outputDir,
    cwd,
    overwritePolicy,
  );

  console.log('');

  const addedCount = copied.length;
  const overwrittenCount = overwritten.length;
  const skippedCount = skipped.length;
  if (addedCount > 0) {
    console.log(`${pc.green('✓')} ${addedCount} file${addedCount !== 1 ? 's' : ''} added`);
  }
  if (overwrittenCount > 0) {
    console.log(
      `${pc.yellow('✓')} ${overwrittenCount} file${
        overwrittenCount !== 1 ? 's' : ''
      } overwritten`,
    );
  }
  if (skippedCount > 0) {
    console.log(
      `${pc.dim(`${skippedCount} file${skippedCount !== 1 ? 's' : ''} skipped (already exist)`)}`,
    );
  }

  if (style === 'plain' && entry.cssFile) {
    console.log(
      `\n${pc.yellow('Reminder:')} Import the CSS file once in your app:\n` +
        `  ${pc.dim(`import './${config.outputDir}/${entry.cssFile}';`)}`,
    );
  }

  if (style === 'tailwind' && !detection.hasTailwind) {
    console.log(
      `\n${pc.yellow('Warning:')} Tailwind was not detected in this project. ` +
        `The Tailwind variant requires Tailwind CSS to be configured.`,
    );
  }

  if (detection.framework === 'cra') {
    console.log(`\n${pc.yellow('Warning:')} Create React App is not supported.`);
  }

  console.log(
    `\nNext steps:\n` +
      `  ${pc.dim(`import { ${componentName} } from './${config.outputDir}/${componentName}';`)}\n` +
      `  ${pc.dim(`<${componentName} config={{ externalProductId: 'prod-001' }} />`)}\n`,
  );

  if (detection.framework === 'next') {
    console.log(
      `${pc.bold('Env vars (Next.js):')}\n` +
        `  ${pc.dim('NEXT_PUBLIC_REVIEWLICO_API_URL=https://api.example.com')}\n` +
        `  ${pc.dim('NEXT_PUBLIC_REVIEWLICO_API_KEY=rk_live_...')}\n`,
    );
  } else if (detection.framework === 'vite') {
    console.log(
      `${pc.bold('Env vars (Vite):')}\n` +
        `  ${pc.dim('VITE_REVIEWLICO_API_URL=https://api.example.com')}\n` +
        `  ${pc.dim('VITE_REVIEWLICO_API_KEY=rk_live_...')}\n`,
    );
  } else {
    console.log(
      `${pc.bold('Env vars:')}\n` +
        `  ${pc.dim('VITE_REVIEWLICO_API_URL=https://api.example.com')}\n` +
        `  ${pc.dim('VITE_REVIEWLICO_API_KEY=rk_live_...')}\n` +
        `  ${pc.dim('NEXT_PUBLIC_REVIEWLICO_API_URL=https://api.example.com')}\n` +
        `  ${pc.dim('NEXT_PUBLIC_REVIEWLICO_API_KEY=rk_live_...')}\n`,
    );
  }
}
