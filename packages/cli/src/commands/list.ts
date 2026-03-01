import pc from 'picocolors';
import { REGISTRY } from '../lib/registry.js';

export function runList() {
  console.log(`\n${pc.bold('Available components:')}\n`);
  for (const [name, entry] of Object.entries(REGISTRY)) {
    console.log(`  ${pc.cyan(name)}`);
    console.log(`    ${pc.dim(entry.description)}\n`);
  }
  console.log(`Add a component:  ${pc.bold('npx @reviewlico/cli add <component>')}`);
  console.log(`With Tailwind:    ${pc.bold('npx @reviewlico/cli add <component> --styles tailwind')}\n`);
}
