import prompts from 'prompts';
import pc from 'picocolors';
import { writeConfig, readConfig, CONFIG_FILE } from '../lib/config.js';
import type { Style } from '../lib/registry.js';
import type { ReviewlicoConfig } from '../lib/config.js';

export async function runInit(cwd: string): Promise<ReviewlicoConfig> {
  const existing = await readConfig(cwd);
  if (existing) {
    console.log(`${pc.green('✓')} Found existing ${CONFIG_FILE}`);
    return existing;
  }

  console.log(`\n${pc.bold('reviewlico')} — let's get you set up\n`);

  const answers = await prompts(
    [
      {
        type: 'text',
        name: 'outputDir',
        message: 'Where should components be copied?',
        initial: 'src/components/reviews',
        validate: (v: string) => (v.trim().length > 0 ? true : 'Path cannot be empty'),
      },
      {
        type: 'select',
        name: 'style',
        message: 'Which styling variant do you want?',
        choices: [
          { title: 'Plain CSS (BEM classes, --rc-* tokens)', value: 'plain' },
          { title: 'Tailwind CSS (utility classes)', value: 'tailwind' },
        ],
        initial: 0,
      },
    ],
    {
      onCancel: () => {
        console.log('\nSetup cancelled.');
        process.exit(0);
      },
    },
  );

  const config: ReviewlicoConfig = {
    outputDir: (answers.outputDir as string).trim().replace(/\/$/, ''),
    style: answers.style as Style,
  };

  await writeConfig(cwd, config);
  console.log(`\n${pc.green('✓')} Created ${CONFIG_FILE}\n`);

  return config;
}
