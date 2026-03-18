import type { Command } from 'commander';
import { agents, detectInstalledAgents } from '../agents.js';

export function registerAbout(program: Command, version: string) {
  program
    .command('about')
    .description('Show version, check prerequisites, and system status')
    .action(async () => {
      const { existsSync, readdirSync } = await import('fs');
      const { execSync } = await import('child_process');
      const { join } = await import('path');
      const { homedir } = await import('os');

      console.log(`\n  oracle-skills v${version}`);
      console.log(`  Digitized from Nat Weerawan's brain — Soul Brews Studio\n`);

      // Check prereqs
      console.log('  Prerequisites:\n');

      const checks: { name: string; ok: boolean; detail: string }[] = [];

      try {
        const bunVersion = execSync('bun --version', { encoding: 'utf-8' }).trim();
        checks.push({ name: 'Bun', ok: true, detail: `v${bunVersion}` });
      } catch {
        checks.push({ name: 'Bun', ok: false, detail: 'not installed (curl -fsSL https://bun.sh/install | bash)' });
      }

      try {
        const gitVersion = execSync('git --version', { encoding: 'utf-8' }).trim().replace('git version ', '');
        checks.push({ name: 'Git', ok: true, detail: `v${gitVersion}` });
      } catch {
        checks.push({ name: 'Git', ok: false, detail: 'not installed' });
      }

      try {
        const ghVersion = execSync('gh --version', { encoding: 'utf-8' }).split('\n')[0].replace('gh version ', '').trim();
        checks.push({ name: 'GitHub CLI', ok: true, detail: `v${ghVersion}` });
      } catch {
        checks.push({ name: 'GitHub CLI', ok: false, detail: 'not installed (optional — needed for /trace, /project)' });
      }

      for (const check of checks) {
        const icon = check.ok ? '✓' : '✗';
        console.log(`  ${icon} ${check.name.padEnd(15)} ${check.detail}`);
      }

      // Detected agents
      console.log('\n  Agents:\n');
      const detected = detectInstalledAgents();
      for (const [key, config] of Object.entries(agents)) {
        const isDetected = detected.includes(key);
        if (!isDetected) continue;

        const skillsDir = config.globalSkillsDir;
        let skillCount = 0;
        if (existsSync(skillsDir)) {
          skillCount = readdirSync(skillsDir, { withFileTypes: true })
            .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
            .length;
        }

        const status = skillCount > 0 ? `${skillCount} skills installed` : 'no skills';
        console.log(`  ✓ ${config.displayName.padEnd(18)} ${status}`);
      }

      const notDetected = Object.entries(agents).filter(([key]) => !detected.includes(key));
      if (notDetected.length > 0) {
        console.log(`    (${notDetected.length} more agents supported — run 'oracle-skills agents' to see all)`);
      }

      // Installed profile hint
      const home = homedir();
      const manifestPath = join(home, '.claude/skills/.oracle-skills.json');
      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(await Bun.file(manifestPath).text());
          console.log(`\n  Installed: v${manifest.version} (${manifest.skills?.length || '?'} skills)`);
          console.log(`  Installed at: ${manifest.installedAt}`);
        } catch {}
      } else {
        console.log('\n  Not initialized. Run: oracle-skills init');
      }

      console.log('');
    });
}
