import type { Command } from 'commander';
import { discoverSkills } from '../installer.js';
import { profiles, resolveProfile } from '../../profiles.js';

export function registerProfiles(program: Command) {
  program
    .command('profiles')
    .description('List available skill profiles')
    .argument('[name]', 'Show skills in a specific profile')
    .action(async (name?: string) => {
      if (name) {
        const profile = profiles[name];
        if (!profile) {
          console.log(`\nUnknown profile: ${name}`);
          console.log(`Available: ${Object.keys(profiles).join(', ')}\n`);
          return;
        }

        const allSkills = await discoverSkills();
        const allNames = allSkills.map((s) => s.name);
        const resolved = resolveProfile(name, allNames);
        const skillList = resolved || allNames;

        console.log(`\nProfile: ${name}`);
        if (profile.include) {
          console.log(`Type: include (${profile.include.length} skills)\n`);
        } else if (profile.exclude) {
          console.log(`Type: exclude ${profile.exclude.length} skills (${skillList.length} remaining)\n`);
        } else {
          console.log(`Type: full (all ${skillList.length} skills)\n`);
        }

        for (const skill of skillList.sort()) {
          console.log(`  - ${skill}`);
        }
        console.log('');
      } else {
        const allSkills = await discoverSkills();
        const allNames = allSkills.map((s) => s.name);

        console.log('\nAvailable profiles:\n');
        for (const [profileName, profile] of Object.entries(profiles)) {
          const resolved = resolveProfile(profileName, allNames);
          const count = resolved ? resolved.length : allNames.length;
          let type = 'all';
          if (profile.include) type = 'include';
          else if (profile.exclude) type = 'exclude';
          console.log(`  ${profileName.padEnd(15)} ${String(count).padStart(2)} skills  (${type})`);
        }
        console.log(`\nUsage: oracle-skills profiles <name>   — show skills in profile`);
        console.log(`       oracle-skills install -g --profile <name> -y\n`);
      }
    });
}
