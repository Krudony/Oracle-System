
$speak = New-Object -ComObject SAPI.SpVoice;
$voices = $speak.GetVoices();
Write-Host "--- Available Windows Voices ---";
foreach ($v in $voices) {
    $desc = $v.GetDescription();
    $lang = $v.GetAttribute("Language");
    Write-Host "Voice: $desc (Language ID: $lang)";
}
if ($voices.Count -eq 0) { Write-Host "No voices found!"; }
