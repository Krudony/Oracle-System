
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $synth.GetInstalledVoices()
foreach ($v in $voices) {
    if ($v.VoiceInfo.Culture.Name -eq "th-TH" -or $v.VoiceInfo.Name -like "*Thai*") {
        $synth.SelectVoice($v.VoiceInfo.Name)
        $text = "สวัสดีครับ ผมอพอลโล ออราเคิล ยินดีที่ได้คุยภาษาไทยกับคุณครับ"
        $synth.Speak($text)
        return
    }
}
# If no Thai voice found, try default
$synth.Speak("Sawadee Krub")
