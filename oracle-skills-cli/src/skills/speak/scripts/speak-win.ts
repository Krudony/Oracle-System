#!/usr/bin/env bun
/**
 * Windows Native Text-to-Speech using PowerShell
 */

import { $ } from "bun";

const args = Bun.argv.slice(2);
let text = "";
let isThai = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--thai" || args[i] === "-t") {
    isThai = true;
  } else if (!args[i].startsWith("-")) {
    text = args[i];
  }
}

if (!text) {
  console.log("Usage: bun speak-win.ts [--thai] \"text\"");
  process.exit(0);
}

console.log(`🔊 Speaking: "${text}"...`);

// PowerShell command for TTS
// It tries to find a Thai voice if --thai is specified
const psCommand = `
$speak = New-Object -ComObject SAPI.SpVoice;
$found = $false;
if ("${isThai}" -eq "True") {
    foreach ($v in $speak.GetVoices()) {
        if ($v.GetAttribute("Language") -eq "41e" -or $v.GetDescription() -like "*Thai*") {
            $speak.Voice = $v;
            $found = $true;
            break;
        }
    }
}
$speak.Speak("${text.replace(/"/g, '`"')}");
`;

await $`powershell -Command ${psCommand}`.quiet();
