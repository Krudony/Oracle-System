import type { Command } from 'commander';
import { agents } from '../agents.js';

export function registerAgents(program: Command) {
  program
    .command('agents')
    .description('List all supported agents')
    .action(() => {
      console.log('\nSupported agents:\n');
      for (const [key, config] of Object.entries(agents)) {
        const installed = config.detectInstalled() ? '✓' : ' ';
        console.log(`  [${installed}] ${key.padEnd(15)} ${config.displayName}`);
      }
      console.log('\n  ✓ = detected on this system\n');
    });
}
