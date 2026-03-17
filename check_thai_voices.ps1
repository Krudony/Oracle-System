
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $synth.GetInstalledVoices()
Write-Host "--- All Installed Voices (System.Speech) ---"
foreach ($v in $voices) {
    $info = $v.VoiceInfo
    Write-Host "Name: $($info.Name) | Culture: $($info.Culture) | Gender: $($info.Gender)"
}

# Try to find Thai voice
$thaiVoice = $voices | Where-Object { $_.VoiceInfo.Culture.Name -eq "th-TH" -or $_.VoiceInfo.Name -like "*Thai*" }

if ($thaiVoice) {
    Write-Host "Found Thai Voice: $($thaiVoice.VoiceInfo.Name)"
    $synth.SelectVoice($thaiVoice.VoiceInfo.Name)
    $synth.Speak("สวัสดีครับ ผม อพอลโล ออราเคิล ยินดีที่ได้คุยภาษาไทยกับคุณครับ")
} else {
    Write-Host "No Thai voice found in System.Speech. Trying direct Thai string to default voice..."
    $synth.Speak("สวัสดีครับ")
}
