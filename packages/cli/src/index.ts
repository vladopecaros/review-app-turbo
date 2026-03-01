import { Command } from 'commander';
import pc from 'picocolors';
import { runAdd } from './commands/add.js';
import { runInit } from './commands/init.js';
import { runList } from './commands/list.js';
import { ConfigError } from './lib/config.js';

const program = new Command();

program
  .name('reviewlico')
  .description('Add reviewlico components to your project')
  .version('0.1.0');

program
  .command('init')
  .description('Configure reviewlico for this project')
  .action(async () => {
    await runInit(process.cwd());
  });

program
  .command('add <component>')
  .description('Add a component to your project')
  .option('--styles <variant>', 'Styling variant: plain or tailwind')
  .action(async (component: string, options: { styles?: string }) => {
    await runAdd(component, options.styles);
  });

program
  .command('list')
  .description('List available components')
  .action(() => {
    runList();
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof ConfigError) {
    console.error(`${pc.red('error')} ${err.message}`);
    process.exit(1);
  }
  throw err;
});
