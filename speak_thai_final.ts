
import { $ } from "bun";

const thaiText = "สวัสดีครับ ผม อพอลโล ออราเคิล ยินดีที่ได้รู้จักครับ";
// Base64 encode the Thai text to avoid PowerShell encoding issues
const base64Thai = Buffer.from(thaiText, 'utf16le').toString('base64');

const psScript = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$text = [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String("${base64Thai}"))

$found = $false
foreach ($v in $synth.GetInstalledVoices()) {
    if ($v.VoiceInfo.Culture.Name -eq "th-TH" -or $v.VoiceInfo.Name -like "*Thai*") {
        $synth.SelectVoice($v.VoiceInfo.Name)
        $found = $true
        break
    }
}

if (-not $found) {
    # If no Thai voice, English voice will try to read it
    $synth.Speak("No Thai voice found. Trying default voice for Thai text.")
}
$synth.Speak($text)
`;

await $`powershell -NoProfile -ExecutionPolicy Bypass -Command ${psScript}`.quiet();
